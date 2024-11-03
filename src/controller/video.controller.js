import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const owner = await User.findById(req.user?._id).select("-password -refreshToken")

    if(!owner) {
        throw new ApiError(400, "User not found")
    }

    if(!title || !description) {
        throw new ApiError(400, "Title and Description are required")
    }

    //get video
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videofileLocalPath = req.files?.videoFile[0]?.path
    if(!videofileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    //upload to cloudinary 
    const videoFile  = await uploadOnCloudinary(videofileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!videoFile) {
        throw new ApiError(500, "Internal server error: Video uploading failed")
    }

    if(!thumbnail) {
        throw new ApiError(500, "Internal server error: Thumbnail uploading failed")
    }
    //create video
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        views: 0, 
        isPublished: true,
        owner: owner._id
    })

    if(!video){
        throw new ApiError(500, "Video registration failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video registered successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
