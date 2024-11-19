import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    toggleLike,
    getLikeCount,
    getLikedUsers,
    getLikedVideos
} from "../controller/like.controller.js"

const router = Router();

router.route('/toggle-like').post(verifyJwt, toggleLike)
router.route('/get-like-count').post(getLikeCount)
router.route('/get-liked-users').post(getLikedUsers)
router.route('/get-liked-vidoes').post(verifyJwt, getLikedVideos)

export default router;