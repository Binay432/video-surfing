import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleLike = asyncHandler(async (req, res) => {
    const { targetId, targetModel } = req.body; 
    const userId = req.user._id; 

    if(!userId) {
        throw new ApiError(400, 'User not found')
    }

    const allowedModels = ["Video", "Comment", "Tweet"];

    if (!allowedModels.includes(targetModel)) {
        throw new ApiError(400, "Invalid target model");
    }

    const existingLike = await Like.findOne({ user: userId, target: targetId, targetModel });

    if (existingLike) {
        // Unlike (remove the like)
        await Like.findByIdAndDelete(existingLike._id);

        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "Like removed successfully"));
    } else {
        // Like the target
        const newLike = await Like.create({ user: userId, target: targetId, targetModel });
        
        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: true, likeId: newLike._id,}, "Like removed successfully"));
    }
});

const getLikeCount = asyncHandler( async(req, res) => {
    const { targetId, targetModel } = req.body

    const stats = await Like.aggregate([
        {
            $match: {
                target: mongoose.Types.ObjectId(targetId),
                targetModel: targetModel
            }
        },
        {
            $group: {
                _id: null,  //Groups all documents into a single result
                totalLikes: {$sum: 1}   // Counts the number of matching documents by adding 1 for each document.
            }
        }
    ])

    const totalLikes = stats[0]?.totalLikes || 0 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            {
                entity: targetId, 
                totalLikes: totalLikes
            }, 
            "Likes fetched successfully"
        )
    )
     
})

const getLikedUsers = asyncHandler(async (req, res) => {
    const {targetId, targetModel} = req.body

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const stats = await Like.aggregatePaginate(
        Like.aggregate([
            {
                $match: {
                    target: mongoose.Types.ObjectId(targetId),
                    targetModel
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "likedBy",
                    foreignField: "_id",
                    as: "likedUser"
                }
            },
            {
                $unwind: "$likedUser"
            },
            {
                $project: {
                    _id: 0,
                    userId: "$likedUser._id",
                    username: "$likedUser.username",
                    avatr:"$likedUser.avatar"
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
            stats,
            'Likes user fetched successfully'
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
  
    const userId = req.user?._id

    if(!userId){
        throw new ApiError(400, "User not found")
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const stats = await Like.aggregatePaginate(
        Like.aggregate([
            {
                $match: {
                    likedby: mongoose.Types.ObjectId(userId),
                    targetModel: "Video"
                }
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: "targetId",
                    foreignField: "_id",
                    as: "likedVideos"
                }
            },
            {
                $unwind: "$likedVideos"
            },
            {
                $project:{
                    _id: 0, 
                    videoId: "$likedVideos._id",
                    title: "$likedVideos.tittle",
                    thumbnail: "$likedVideos.thumbnail",
                }
            }
        ]),
        options
    )

    if(!stats) {
        throw new ApiError(500, "Something went wrong!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            stats, 
            "LIked videos fetched successfully"
        )
    )
})
export {
    toggleLike,
    getLikeCount,
    getLikedUsers,
    getLikedVideos
}