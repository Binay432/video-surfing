import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const owner = req.user._id; 

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({ content, owner });
    return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            tweet,
            "Tweet created successfully"
        )
    );
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

    if (!tweets.length) {
        throw new ApiError(404, "No tweets found for this user");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "User tweets fetched successfully"
        )
    );
});

// Update a tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required for update");
    }

    // Update the tweet if the ID matches and the owner is the current user
    const result = await Tweet.updateOne(
        { 
            _id: tweetId, 
            owner: userId 
        }, // Ensure the tweet belongs to the requesting user
        { 
            $set: { content } 
        },          
        { 
            new: true 
        }                 
    );

    if (result.matchedCount === 0) {
        throw new ApiError(404, "Tweet not found or you do not have permission to edit this tweet");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            result,
            "Tweet updated successfully"
        )
    );
});

// Delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this tweet");
    }

    await tweet.deleteOne();    // can be performed on instance, leaving unoptimzed it for note 

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            "Tweet deleted successfully"
        )
    );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
