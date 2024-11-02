import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { 
    addComment, 
    deleteComment, 
    getVideoComments, 
    updateComment 
} from "../controller/comment.controller.js";

const router = Router(); 

//apply to all routes 
router.use(verifyJwt);
router.route('/add-comment').post(addComment)
router.route('/get-comments/:videoId').get(getVideoComments)
router.route('/update-comment/:commentId').patch(updateComment)
router.route('delete-comment/:commentId').delete(deleteComment)
export default router