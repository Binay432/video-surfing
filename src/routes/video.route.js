import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { 
    getVideoById, 
    publishAVideo,
    deleteVideo
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

export default router; 
