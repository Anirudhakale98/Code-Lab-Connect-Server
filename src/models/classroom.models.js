import mongoose, { Schema } from "mongoose";
import crypto from "crypto"; // For generating unique IDs

// Generate a random color for the classroom
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};


const classroomSchema = new Schema(
  {
    classroomId: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        return crypto.randomBytes(3).toString("hex").toUpperCase(); // Generates a 6-char hex string
      },
    },
    title: {
      type: String,
      unique: true,
      required: [true, "Classroom name is required"],
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      default: getRandomColor,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    createdBy: {
      type: String,
      required: [true, "Created by is required"],
    },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    assignments: [{ type: Schema.Types.ObjectId, ref: "Assignment" }],
  },
  { timestamps: true }
);

// Generate a unique classroom ID before saving
classroomSchema.pre("save", async function (next) {
  if (!this.classroomId) {
    let uniqueId;
    let isUnique = false;
    while (!isUnique) {
      uniqueId = crypto.randomBytes(3).toString("hex").toUpperCase();
      const existingClass = await Classroom.findOne({ classroomId: uniqueId });
      if (!existingClass) isUnique = true;
    }
    this.classroomId = uniqueId;
  }
  next();
});


export const Classroom = mongoose.model("Classroom", classroomSchema);
