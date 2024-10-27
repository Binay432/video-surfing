import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser }; 