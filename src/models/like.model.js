import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema({
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    targetModel: {
        type: String,
        required: true,
        enum:  ["Video", "Comment", "Tweet"]
    },
    target: {
        types: Schema.Types.ObjectId,
        ref: "targetModel",
        required: true
    },
}, {timestamps: true})

//preventing duplicate likes
likeSchema.index({ likedBy: 1, target: 1}, {unique: true});

export const Like = mongoose.model("Like", likeSchema)