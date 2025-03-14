import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponce.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";
import { Classroom } from "../models/classroom.models.js";
import { Assignments } from "../models/assignments.models.js";
import mongoose from "mongoose";
import { Submissions } from "../models/submission.models.js";
import axios from "axios";

/// Get all classes of a student
const getClasses = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found.");

    // Ensure classes are valid ObjectIds
    const classIds =
        user.classes?.map((id) => new mongoose.Types.ObjectId(id)) || [];

    // Fetch classes
    const classes = await Classroom.find({ _id: { $in: classIds } });

    // console.log("Fetched Classes:", classes);

    res.status(200).json(
        new ApiResponse(200, classes, "Classes retrieved successfully.")
    );
});

// Join a class
const joinClass = asyncHandler(async (req, res) => {
    const { classroomId } = req.body;
    // console.log("classroomId", classroomId);
    const user = await User.findById(req.user._id);
    const classroom = await Classroom.findOne({ classroomId: classroomId });
    if (!classroom) throw new ApiError(404, "Classroom not found.");
    if (user.classes.includes(classroom._id))
        throw new ApiError(400, "You are already in this class.");
    user.classes.push(classroom._id);
    await user.save();
    classroom.students.push(user._id);
    await classroom.save();
    res.status(201).json(new ApiResponse(201, classroom));
});

// Delete a class
const deleteClass = asyncHandler(async (req, res) => {
    const { classroomId } = req.params;
    // console.log("classroomId", classroomId);
    const user = await User.findById(req.user._id);
    const classroom = await Classroom.findOne({ classroomId: classroomId });
    if (!classroom) throw new ApiError(404, "Classroom not found.");
    if (!user.classes.includes(classroom._id))
        throw new ApiError(400, "You are not in this class.");

    // Remove the class from the user's classes
    user.classes = user.classes.filter((id) => id.toString() !== classroom._id.toString());
    await user.save();
    res.status(200).json(new ApiResponse(200, "Class deleted successfully."));
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

// Get a specific assignment
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

// Execute code function
const executeCode = async ({ code, language, input }) => {
    try {
        let versionIndex = '0';
        if (language === 'python') {
            language = 'python3';
            versionIndex = '5';
        } else if (language === 'java') {
            language = 'java';
            versionIndex = '5';
        } else if (language === 'cpp') {
            language = 'cpp17';
            versionIndex = '2';
        }

        const response = await axios.post('https://api.jdoodle.com/v1/execute', {
            clientId: process.env.JDOODLE_CLIENT_ID,
            clientSecret: process.env.JDOODLE_CLIENT_SECRET,
            script: code,
            stdin: input || '',
            language,
            versionIndex,
            compileOnly: false // Set to true for compilation only
        });

        const { output, error } = response.data;

        // console.log('JDoodle Response:', response.data);

        if (error) {
            return { output: `Compilation Error: ${error}` }; // Return the compilation error
        }

        // If output is empty or just newlines, indicate successful compilation
        if (!output || output.trim() === '') {
            return { output: 'Compilation successful, no errors found.' };
        }

        return { output };
    } catch (err) {
        console.error('JDoodle API Error:', err.message);
        throw new Error('Code execution failed');
    }
};
// Run code for an assignment
const runCode = asyncHandler(async (req, res) => {
    const { code, language, input } = req.body;

    const result = await executeCode({ code, language, input });
    // console.log("Result of code execution   ", result);

    res.status(200).json(new ApiResponse(200, { output: result.output }));
});

// Submit an assignment
const submitAssignment = asyncHandler(async (req, res) => {
    const { code, language, input } = req.body;
    const { classroomId, assignmentId } = req.params;

    const { output } = await executeCode({ code, language, input });

    const classroom = await Classroom.findOne({ classroomId });
    if (!classroom) {
        throw new ApiError(404, 'Classroom not found');
    }

    const assignment = await Assignments.findOne({ _id: assignmentId });
    if (!assignment) {
        throw new ApiError(404, 'Assignment not found');
    }

    let submission = await Submissions.findOne({
        assignmentId: assignment._id,
        studentId: req.user._id,
    });

    if (submission) {
        submission.submission = { code, input, output };
        await submission.save();
    } else {
        submission = new Submissions({
            assignmentId: assignment._id,
            studentId: req.user._id,
            submission: { code, input, output },
        });
        assignment.submissions.push(submission._id);
        await submission.save();
    }

    res.status(201).json(new ApiResponse(201, { submission }));
});

// Get a submission
const getSubmission = asyncHandler(async (req, res) => {
    const { classroomId, assignmentId, studentId } = req.params;
    // console.log("Request Params: ", req.params);
    // console.log("classroomId: "+ classroomId);
    // console.log("assignmentId: "+ assignmentId);
    // console.log("studentId: "+ studentId);
    const submission = await Submissions.findOne({
        assignmentId: assignmentId,
        studentId: studentId,
    });
    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }
    res.status(200).json(new ApiResponse(200, { submission }));
});

export {
    getClasses,
    joinClass,
    deleteClass,
    getClassroom,
    getAssignments,
    getAssignment,
    runCode,
    submitAssignment,
    getSubmission,
};
