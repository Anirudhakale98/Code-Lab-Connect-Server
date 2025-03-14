import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponce.js";
import { ApiError } from "../utils/ApiError.js";
import { Classroom } from "../models/classroom.models.js";
import { User } from "../models/users.models.js";
import { Assignments } from "../models/assignments.models.js";
import { Submissions } from "../models/submission.models.js";

// Get all classes
const getClasses = asyncHandler(async (req, res) => {
    // console.log("id: "+ req.user._id);
    const classes = await Classroom.find({ createdBy: req.user._id });
    res.status(200).json(new ApiResponse(200, { classes }));
});

// Add a class
const addClass = asyncHandler(async (req, res) => {
    const { title, color, description } = req.body;
    if (!title || !color || !description) {
        throw new ApiError(400, "Please provide all details");
    }
    const newClass = await Classroom.create({
        title,
        color,
        description,
        createdBy: req.user._id,
    });
    // console.log("newClass: "+ newClass);
    await req.user.classes.push(newClass._id);
    await req.user.save();
    res.status(201).json(new ApiResponse(201, { classroom: newClass }));
});

// Delete a class
const deleteClass = asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    // console.log("classroomId: "+ classroomId);
    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }
    const deltedClass = await Classroom.deleteOne({ classroomId });
    // console.log("deltedClass: "+ deltedClass);
    await req.user.classes.remove(classroom._id);
    await req.user.save();

    res.status(200).json(
        new ApiResponse(200, { message: "Classroom deleted" })
    );
});

// Get a class
const getClassroom = asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    // console.log("classroomId: "+ classroomId);
    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }
    res.status(200).json(new ApiResponse(200, { classroom: classroom }));
});

// Get all assignments of a class
const getAssignments = asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }
    const assignments = await Assignments.find({
        _id: { $in: classroom.assignments },
    });
    res.status(200).json(new ApiResponse(200, { assignments }));
});

// Add an assignment to a class
const addAssignment = asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    const { title, description, deadline, exampleInput, exampleOutput } = req.body;
    // console.log("req.body: ", req.body);
    if (!title || !description || !deadline) {
        throw new ApiError(400, "Please provide all details");
    }
    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }
    const newAssignment = await Assignments.create({
        title,
        description,
        deadline,
        "example.input": exampleInput,
        "example.output": exampleOutput,
        createdBy: req.user._id,
    });
    await classroom.assignments.push(newAssignment._id);
    await classroom.save();
    res.status(201).json(new ApiResponse(201, { assignments: newAssignment }));
});

// Delete an assignment
const deleteAssignment = asyncHandler(async (req, res) => {
    const { classroomId, assignmentId } = req.params;
    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }
    const assignment = await Assignments.findOne({ _id: assignmentId });
    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }
    const deletedAssignemnt = await Assignments.deleteOne({ _id: assignmentId });
    await classroom.assignments.remove(deleteAssignment._id);
    await classroom.save();
    res.status(200).json(
        new ApiResponse(200, { message: "Assignment deleted" })
    );
});

// Get an assignment
const getAssignment = asyncHandler(async (req, res) => {
    const { classroomId, assignmentId } = req.params;
    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }
    const assignment = await Assignments.findOne({ _id: assignmentId });
    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }
    res.status(200).json(new ApiResponse(200, { assignment }));
});

// Get all students of an assignment
const getSubmittedStudents = asyncHandler(async (req, res) => {
    const { classroomId, assignmentId } = req.params;
    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }
    const assignment = await Assignments.findOne({ _id: assignmentId });
    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }
    const submissionRes = await Submissions
        .find({ assignmentId: assignmentId })
        .populate("studentId");
    // console.log("submissionRes: ", submissionRes);

    const students = submissionRes.map((submission) => submission.studentId);
    res.status(200).json(new ApiResponse(200, { students }));
    
});

// Get all students who have not submitted an assignment
const getNotSubmittedStudents = asyncHandler(async (req, res) => {
    const { classroomId, assignmentId } = req.params;

    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, "Classroom not found");
    }

    const assignment = await Assignments.findOne({ _id: assignmentId });
    if (!assignment) {
        throw new ApiError(404, "Assignment not found");
    }

    // Fetch all students in the classroom
    // console.log("classroom.students: ", classroom.students);
    const students = await User.find({ _id: { $in: classroom.students } });
    // console.log("students: ", students);
    // Fetch submissions for the given assignment
    const submissions = await Submissions.find({ assignmentId });

    // Extract the IDs of students who have submitted
    const submittedStudentIds = submissions.map((submission) => submission.studentId.toString());

    // Filter out students who haven't submitted
    const notSubmittedStudents = students.filter(
        (student) => !submittedStudentIds.includes(student._id.toString())
    );
    // console.log("notSubmittedStudents: ", notSubmittedStudents);
    res.status(200).json(new ApiResponse(200, { students: notSubmittedStudents }));
});


// Add marks to a submission
const addMarks = asyncHandler(async (req, res) => {
    const { classroomId, assignmentId, submissionId } = req.params;
    const { marks } = req.body || 0;
    const submission = await Submissions.findOne({ _id: submissionId });
    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }
    submission.marks = marks;
    await submission.save();
    res.status(200).json(new ApiResponse(200, { submission }));
});

export {
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
    addMarks
};
