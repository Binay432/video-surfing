import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controller/playlist.controller.js"

const router = Router();

router.use(verifyJwt)
router.route('/create').post(createPlaylist)
router.route('/get/:userId').get(getUserPlaylists)
router.route('/get/:playlistId').get(getPlaylistById)
router.route('/add-video/:playlistId/:videoId').patch(addVideoToPlaylist)
router.route('/remove-video/:playlistId/:videoId').delete(removeVideoFromPlaylist)
router.route('/delete/:playlistId').delete(deletePlaylist)
router.route('/update/:playlistId').patch(updatePlaylist)
export default router;