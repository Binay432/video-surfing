import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId) {
        throw new ApiError(400, "Video id is required")
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(String(videoId))
                }
            },
            {
               $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField:"_id",
                    as: "ownerInfo"
               } 
            },
            // convert to single document, rather than an array 
            {
                $unwind: "$ownerInfo"
            },
            {
                $project: {
                    content: 1,
                    video: 1,
                    createdAt: 1,
                    "ownerInfo._id": 1, 
                    "ownerInfo.username": 1,
                    "ownerInfo.avatar": 1
                }
            }
        ]),
        options
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Comments retrived successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    const {content, videoId} = req.body;
    const user = await User.findById(req.user?._id);

    if(!user) {
        throw new ApiError(404, "Unauthorized access")
    }

    if(!content || !videoId) {
        throw new ApiError(400, "Content and video are required")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400, "Video not found")
    }

    const comment = await Comment.create({
        content,
        video: videoId, 
        owner: user._id
    })

    if (!comment) {
        throw new ApiError(500, "Something went wrong while adding comment")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment added successfully"
        )
    )

})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content } = req.body

    const owner = await User.findById(req.user?._id)

    if (!commentId) {
        throw new ApiError(400, "Comment id is required")
    }

    if(!owner) {
        throw new ApiError(404, "Unauthorized access")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!comment){
        throw new ApiError(404, "Something went wrong while updating comment")
    }

    return res
    .status (200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const user = await User.findById(req.user?._id)

    if(!commentId) {
        throw new ApiError(400,"Comment id is required")
    }

    if(!user) {
        throw new ApiError(404, "Unauthorized access")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment) {
        throw new ApiError(404, "Comment not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, null, "Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}