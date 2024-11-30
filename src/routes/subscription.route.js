import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controller/subscription.controller.js"

const router = Router()

router.use(verifyJwt)
router.route('/toggle-subscription/:channelId').post(toggleSubscription)
router.route('/ get-subscriber/:channelId').get(getUserChannelSubscribers)
router.route('/get-suscribed-channel/:subscribedId').get(getSubscribedChannels)

export default router; 
