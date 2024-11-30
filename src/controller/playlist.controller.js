import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const userId = req.user._id; 
    
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: userId,
        videos: []
    });

    return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            newPlaylist, 
            "Playlist created successfully"
        )
    );
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId })
        .populate("videos", "title videoFile thumbnail") // get title videofile and thumbnail link only 
        .sort({ createdAt: -1 });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlists,
            "Playlists retrieved successfully"
        )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title videoFile duration")   
        .populate("owner", "username email");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlist, 
            "Playlist retrieved successfully" 
        )
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const result = await Playlist.updateOne(
        { 
            _id: playlistId, 
            videos: { 
                $ne: videoId  // Ensures the video is not already in the playlist
            }
        },
        { 
            $push: { 
                videos: videoId 
            } 
        },
        {
            new: true
        }
    );

    if (result.modifiedCount === 0) {
        throw new ApiError(400, "Video is already in the playlist or playlist not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            "Video added to playlist successfully"
        )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const result = await Playlist.updateOne(
        { 
            _id: playlistId, 
            videos: { 
                $in: videoId  // Ensures videoId is already in the videos array
            }
        },
        { 
            $pull: { 
                videos: videoId 
            } 
        },
        {
            new: true
        }
    );

    if(!result) {
        throw new ApiError(500, "Something went wrong !")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            result,
            "Video removed from playlist successfully"
        )
    );

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    await Playlist.deleteOne({ _id: playlistId });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            "Playlist deleted successfully"
        )
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist");
    }

    if (name) {
         playlist.name = name;
    }
    if (description) {
        playlist.description = description;
    }
    
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, "Playlist updated successfully", playlist));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
