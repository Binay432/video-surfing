import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { application } from "express";

const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //saving refreshToken to db 
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})  // prevent the validation as only refresh token is updating 
        
        return {accessToken, refreshToken};

    }catch(error){
        throw new ApiError(500, "Something went wrong while generating access and refresh token!")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // Get user data from validation based on built data model
    const { fullName, email, username, password } = req.body;

    // check validation all fields are included 
    if(
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists
    const existedUser = await User.findOne({
        $or:[{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists!")
    }

    // check for images
    // as express give direct access to body, multer middlewares provide an excess to files
    // avatar will have multiple fields like format, size, etcc in which first field i.e., [0] through which file path is taken 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // optional chaining can cause issue sometime, specially for optional data 
    // like in coverImageLocalPath, thus here, classical methods is used 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // check for avatar 
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them to  cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    
    // create user object - create entry in db 
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response 
    // here select option will removed the password and refreshToken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check if user is created 
    if (!createdUser) {
        throw new ApiError(500, "Somethig went wrong while registering user !")
    }

    // return response 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully!")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data 
    const { email, username, password } = req.body;

    // username or email
    if(!username && !email) {
        throw new ApiError(400, "username or password is required")
    }

    // find the user 
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user) {
        throw new ApiError(400, "User doesn't exist!")
    }

    // if user , check password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // if password match -> access and refresh token 
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    // send cookies 
    const  loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        // options for cookies
        // modifiable only from server side
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken   // this allow user to customly save the info, useful for mobile applicatiion 
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true   // this make sure new update value is returned 
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200,{}, "User logged out successfully!")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    //verify refresh token
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        // match the incoming and user refresh token 
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findByIdAndDelete(req.user?._id)

    if(!user){
        throw new ApiError(401, "User not found!")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password!")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")   //depends on auth middelware 
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName && !email) {
        throw new ApiError(400, "All fields are required!")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path  // not files unlike that in register, cz only one file is recieving here 
    
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing !")
    }

    const avatar = await uploadOnCloudinary (avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    
    return res 
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated succesfully!")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path  // not files unlike that in register, cz only one file is recieving here 
    
    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing !")
    }

    const coverImage = await uploadOnCloudinary (coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res 
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated succesfully!")
    )
})
export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};   