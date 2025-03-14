import mongoose, { Schema } from "mongoose";

const assignmentsSchema = new Schema(
  {
    title:{
      type: String,
      required: [true, "Title is required"],
    },
    description: {
      // question description
      type: String,
      required: [true, "Description is required"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    "example.input": {
      type: String,
    },
    "example.output": {
      type: String,
    },
    submissions: [{ type: Schema.Types.ObjectId, ref: "Submission" }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
  },
  { timestamps: true }
);

export const Assignments = mongoose.model("Assignments", assignmentsSchema);