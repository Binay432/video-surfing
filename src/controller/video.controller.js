import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, updateFileInCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


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
        videoPublicId: videoFile.public_id,
        thumbnail: thumbnail.url,
        thumbnailPublicId: thumbnail.public_id,
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
    const user = await User.findById(req.user)

    if(!videoId) {
        throw new ApiError(400, "Video id is required")
    }

    if(!user) {
        throw new ApiError(400, "User is not found")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video not found")
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200, 
            video,
            "Video fetched successfully"
        )
    )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const owner = await User.findById(req.user?._id)

    if(!videoId){
        throw new ApiError(400, 'Video id is required')
    }

    if(!owner){
        throw new ApiError(400, 'User is not found')
    }
    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, 'Video not found')
    }

    const videoPublicId = video.videoPublicId

    const videofileLocalPath = req.files?.videoFile[0]?.path
    if(!videofileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    const updatedVideoFile = await updateFileInCloudinary(videofileLocalPath, videoPublicId)

    if(!updatedVideoFile) {
        throw new ApiError(500, 'Internal server error while updating video')
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            $set:{
                videoFile: updatedVideoFile.url,
                videoPublicId: updatedVideoFile.public_id
            }
        },
        {
            new: true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video updated successfully"
        )
    )

})

const updateThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const owner = await User.findById(req.user?._id)

    if(!videoId){
        throw new ApiError(400, 'Video id is required')
    }

    if(!owner){
        throw new ApiError(400, 'User is not found')
    }
    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, 'Video not found')
    }

    const thumbnailPublicId = video.thumbnailPublicId

    const thumbnailfileLocalPath = req.files?.thumbnail[0]?.path
    if(!thumbnailfileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    const updatedThumbnailFile = await updateFileInCloudinary(thumbnailfileLocalPath, thumbnailPublicId)

    if(!updatedThumbnailFile) {
        throw new ApiError(500, 'Internal server error while updating video')
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            $set:{
                videoFile: updatedThumbnailFile.url,
                thumbnailPublicId: updatedThumbnailFile.public_id
            }
        },
        {
            new: true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video updated successfully"
        )
    )

})
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const owner = await User.findById(req.user?._id)

    if (!videoId) {
        throw new ApiError(400, "Video id is required")
    }

    if(!owner) {
        throw new ApiError(400, "User not found")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    //Object Reference Equality:
    if (!owner._id.equals(video.owner)) {
        throw new ApiError(401, "Unauthorized access");
    }

    //delete from cloudinary, mention the resource type explicitly
    const deleteVideo = await deleteFromCloudinary(video.videoPublicId, "video")
    if (deleteVideo.result !== 'ok'){
        throw new ApiError(500, "Something went wrong while deleting video from cloudinary")
    }

    const deleteThumbnail = await deleteFromCloudinary(video.thumbnailPublicId, "image")
    if (deleteThumbnail.result !== 'ok'){
        throw new ApiError(500, "Something went wrong while deleting thumbnail from cloudinary")
    }

    const deletedVideo = await Video.findByIdAndDelete(video._id)

    if(!deletedVideo){
        throw new ApiError(404, "Video not found")
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(200, null, "Video deleted successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    updateThumbnail,
    deleteVideo,
    togglePublishStatus
}
