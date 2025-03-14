import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    getClasses,
    addClass,
    getClassroom,
    deleteClass,
    getAssignments,
    addAssignment,
    deleteAssignment,
    getAssignment,
    getSubmittedStudents,
    getNotSubmittedStudents,
    addMarks,
} from "../controllers/teachers.controllers.js";
const router = Router();

// secured routes
router.route("/classes").get(verifyJWT(["teacher"]), getClasses);
router.route("/classes").post(verifyJWT(["teacher"]), addClass);
router.route("/classes/:classroomId/delete").post(verifyJWT(["teacher"]), deleteClass);
router.route("/classes/:classroomId").get(verifyJWT(["teacher"]), getClassroom);
router
    .route("/classes/:classroomId/assignments")
    .get(verifyJWT(["teacher"]), getAssignments);
router
    .route("/classes/:classroomId/assignments")
    .post(verifyJWT(["teacher"]), addAssignment);
router
    .route("/classes/:classroomId/assignments/:assignmentId/delete")
    .post(verifyJWT(["teacher"]), deleteAssignment);
router
    .route("/classes/:classroomId/assignments/:assignmentId")
    .get(verifyJWT(["teacher"]), getAssignment);
router
    .route("/classes/:classroomId/assignments/:assignmentId/students")
    .get(verifyJWT(["teacher"]), getSubmittedStudents);
router
    .route(
        "/classes/:classroomId/assignments/:assignmentId/notSubmittedStudents"
    )
    .get(verifyJWT(["teacher"]), getNotSubmittedStudents);

router.
    route("/classes/:classroomId/assignments/:assignmentId/submissions/:submissionId/marks")
    .post(verifyJWT(["teacher"]), addMarks);

export default router;
