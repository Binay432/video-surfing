import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addComment } from "../controller/comment.controller.js";

const router = Router(); 

//apply to all routes 
router.use(verifyJwt);
router.route('/add-comment').post(addComment)

export default router