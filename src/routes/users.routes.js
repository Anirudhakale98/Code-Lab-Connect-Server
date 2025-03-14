import { Router } from "express";
import { registerUser, loginUser, logoutUser, getMe, getUser } from "../controllers/users.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


const router = Router();


router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secured routes
router.route("/me").get(verifyJWT(["teacher","student"]), getMe);
router.route("/:id").get(verifyJWT(["teacher","student"]), getUser);
router.route("/logout").post(verifyJWT(["teacher","student"]), logoutUser);
export default router;