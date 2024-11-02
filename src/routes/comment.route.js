import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addComment, getVideoComments } from "../controller/comment.controller.js";

const router = Router(); 

//apply to all routes 
router.use(verifyJwt);
router.route('/add-comment').post(addComment)
router.route('/get-comments/v/:videoId').get(getVideoComments)

export default router