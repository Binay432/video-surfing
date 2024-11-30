import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const subscriberId = req.user._id;


    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Prevent self-subscription
    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    // // Check if the subscription already exists
            // Approach One

    // const existingSubscription = await Subscription.findOne({
    //     subscriber: subscriberId,
    //     channel: channelId,
    // });

    // if (existingSubscription) {
    //     await existingSubscription.remove();     // here remove operates over an instance and directly perform on db
    //     return res.status(200).json(new ApiResponse(200, "Subscription removed successfully"));
    // } else {
    //     // Otherwise, create a new subscription
    //     await Subscription.create({
    //         subscriber: subscriberId,
    //         channel: channelId,
    //     });
    //     return res.status(201).json(new ApiResponse(201, "Subscription added successfully"));
    // }

    //Optimized way 

    // Check if the subscription exists and remove it directly if found
    // deleteOne will check if the suibscription exists, if yes remove it 
    // benefit is it eliminate  intermediate roles of instance 

    const result = await Subscription.deleteOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (result.deletedCount > 0) {
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                "Subscription removed successfully"
            )
        );
    }

    // If no subscription was deleted, create a new subscription
    await Subscription.create({
        subscriber: subscriberId,
        channel: channelId,
    });

    return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            "Subscription added successfully"
        )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Ensure the channel ID is valid
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Find subscribers of the channel
    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar")
        .select("subscriber createdAt");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            subscribers,
            "Subscribers fetched successfully"
        )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Ensure the subscriber ID is valid
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    // Find channels the user has subscribed to
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username avatar")
        .select("channel createdAt");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            subscribedChannels,
            "Subscribed channels fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}