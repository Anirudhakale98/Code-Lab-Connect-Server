import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { getClasses, joinClass, deleteClass, getClassroom, getAssignments, getAssignment, runCode, submitAssignment, getSubmission} from "../controllers/students.controllers.js";



const router = Router();

router.route("/classes").get(verifyJWT(["student"]), getClasses);
router.route("/join").post(verifyJWT(["student"]), joinClass);
router.route("/classes/:classroomId/delete").post(verifyJWT(["student"]), deleteClass);
router.route("/classes/:classroomId").get(verifyJWT(["student"]), getClassroom);
router.route("/classes/:classroomId/assignments").get(verifyJWT(["student"]), getAssignments);
router.route("/classes/:classroomId/assignments/:assignmentId").get(verifyJWT(["student"]), getAssignment);
router.route("/classes/:classroomId/assignments/:assignmentId/run-code").post(verifyJWT(["student"]), runCode);
router.route("/classes/:classroomId/assignments/:assignmentId/submit").post(verifyJWT(["student"]), submitAssignment);
router.route("/classes/:classroomId/assignments/:assignmentId/submissions/:studentId").get(verifyJWT(["student","teacher"]), getSubmission);


export default router;