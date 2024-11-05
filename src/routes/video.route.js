import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { 
    getVideoById, 
    publishAVideo,
    deleteVideo,
    updateVideo,
    updateThumbnail,
    getAllVideos,
    togglePublishStatus
} from "../controller/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router()
router.use(verifyJwt)

// Correction needed for multer uploading
router.route('/publish-video').post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
)
router.route('/get-video/:videoId').get(getVideoById)
router.route('/delete-video/:videoId').delete(deleteVideo)
router.route('/update-video').patch(upload.single('videoFile'),updateVideo)
router.route('/update-thumbnail').patch(upload.single('thumbnail'),updateThumbnail)
router.route('/get-all-videos').get(getAllVideos)
router.route('/toggle-publish-status/:videoId').patch(togglePublishStatus)
export default router; 
