import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String, //cloudinary url
        required: true 
    },
    videoPublicId:{
        type: String, //id from cloudinary
        required: true
    },
    thumbnail: {
        type: String, //cloudinary url
        required: true 
    },
    thumbnailPublicId:{
        type: String, //id from cloudinary 
        required: true
    },
    title: {
        type: String, 
        required: true 
    },
    description: {
        type: String,
        required: true
    },
    duration :{
        type : Number,  // comes from cloudinary
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true})

//mongoose middleware to impliment plugin for aggregate pipeline
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)