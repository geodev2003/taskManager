const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// 🔐 Protect all task routes
router.use(authMiddleware);

/**
 * CREATE TASK
 * POST /tasks
 * Header: Idempotency-Key
 */
router.post("/", taskController.createTask);

/**
 * GET TASK LIST (search + pagination)
 * GET /tasks
 */
router.get("/", taskController.getTasks);

/**
 * GET MY DELETED TASKS (User's own tasks)
 * GET /tasks/deleted/my
 */
router.get("/deleted/my", taskController.getMyDeletedTasks);

/**
 * GET SOFT DELETED TASKS (Admin only)
 * GET /tasks/deleted
 */
router.get("/deleted", taskController.getSoftDeletedTasks);

/**
 * RESTORE TASK (phải đặt trước /:id routes để tránh conflict)
 * POST /tasks/:id/restore
 */
router.post("/:id/restore", taskController.restoreTask);

/**
 * HARD DELETE TASK (Admin only)
 * DELETE /tasks/:id/hard
 */
router.delete("/:id/hard", taskController.deleteHardTask);

/**
 * UPDATE TASK (optimistic lock)
 * PUT /tasks/:id
 */
router.put("/:id", taskController.updateTask);

/**
 * SOFT DELETE TASK
 * DELETE /tasks/:id
 */
router.delete("/:id", taskController.deleteSoftTask);

/**
 * GET TASK AUDITS
 * GET /tasks/:id/audits
 */
router.get("/:id/audits", taskController.getTaskAudits);

module.exports = router;
