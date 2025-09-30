const express = require("express");
const router = express.Router();
const { authenticate: authMiddleware } = require("../middleware/authMiddleware");
const { 
  createStudent, 
  getStudentById, 
  getStudentsByInstructorId,
  getStudentsWithoutInstructor,
  getStudents,
  updateStudent, 
  deleteStudent,
  unassignInstructor,
  addProgressLog,
  updateGoalStatus
} = require("../controllers/studentController");

// Routes
router.get("/", authMiddleware, getStudents);
router.post("/", authMiddleware, createStudent);
router.get("/:studentId", authMiddleware, getStudentById);
router.put("/:studentId", authMiddleware, updateStudent);
router.delete("/:studentId", authMiddleware, deleteStudent);
router.delete("/:studentId/instructor", authMiddleware, unassignInstructor);
router.post("/:studentId/progress", authMiddleware, addProgressLog);

// Additional routes
router.get("/instructor/:instructorId", getStudentsByInstructorId);
router.get("/unassigned", getStudentsWithoutInstructor);
router.put("/:studentId/goals/:goalId", updateGoalStatus);

module.exports = router;