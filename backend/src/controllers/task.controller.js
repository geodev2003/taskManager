const taskService = require("../services/task.service");
const AppError = require("../utils/appError");

/**
 * CREATE TASK
 * POST /tasks
 */
async function createTask(req, res, next) {
  try {
    const uId = req.user.uId;
    const idempotencyKey = req.headers["idempotency-key"];

    const result = await taskService.createTask(uId, req.body, idempotencyKey);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET TASK LIST
 * GET /tasks?search=&page=&limit=
 */
async function getTasks(req, res, next) {
    try {
      const { search = "", page = 1, limit = 10 } = req.query;
  
      const result = await taskService.getTasks(
        req.user,
        search,
        Number(page),
        Number(limit)
      );
  
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

/**
 * GET MY DELETED TASKS (USER'S OWN TASKS)
 * GET /tasks/deleted/my?search=&page=&limit=
 */
async function getMyDeletedTasks(req, res, next) {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const result = await taskService.getMyDeletedTasks(
      req.user.uId,
      search,
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET SOFT DELETED TASKS (ADMIN ONLY)
 * GET /tasks/deleted?search=&page=&limit=
 */
async function getSoftDeletedTasks(req, res, next) {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const result = await taskService.getSoftDeletedTasks(
      req.user,
      search,
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}
  

/**
 * UPDATE TASK
 * PUT /tasks/:id
 */
const updateTask = async (req, res, next) => {
    try {
      const user = req.user; // { uId, uRole }
      const tId = Number(req.params.id);
  
      if (!Number.isInteger(tId)) {
        throw new AppError(
          "INVALID_TASK_ID",
          "Task id must be a number",
          400
        );
      }
  
      const updatedTask = await taskService.updateTask(
        user,
        tId,
        req.body
      );
  
      res.status(200).json({
        message: "Task updated successfully",
        data: updatedTask
      });
    } catch (err) {
      next(err);
    }
  };

/**
 * SOFT DELETE TASK
 * DELETE /tasks/:id
 */
const deleteSoftTask = async (req, res, next) => {
    try {
      const tId = Number(req.params.id);
  
      if (Number.isNaN(tId)) {
        throw new AppError("INVALID_TASK_ID", "Task id is invalid", 400);
      }
  
      const result = await taskService.softDeleteTask(req.user, tId);
  
      res.status(200).json({
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  };

/**
 * RESTORE TASK
 * POST /tasks/:id/restore
 */
async function restoreTask(req, res, next) {
  try {
    const tId = Number(req.params.id);

    if (!Number.isInteger(tId) || tId <= 0) {
      throw new AppError("INVALID_TASK_ID", "Task id is invalid", 400);
    }

    const result = await taskService.restoreTask(req.user, tId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HARD DELETE TASK
 * DELETE /tasks/:id/hard
 * (nếu bạn expose route này)
 */
const deleteHardTask = async (req, res, next) => {
    try {
      const tId = Number(req.params.id);
  
      if (Number.isNaN(tId)) {
        throw new AppError("INVALID_TASK_ID", "Task id is invalid", 400);
      }
  
      const result = await taskService.hardDeleteTask(req.user, tId);
  
      res.status(200).json({
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  };

/**
 * GET TASK AUDITS
 * GET /tasks/:id/audits
 */
async function getTaskAudits(req, res, next) {
  try {
    const uId = req.user.uId;
    const tId = Number(req.params.id);

    if (!Number.isInteger(tId) || tId <= 0) {
      throw new AppError("INVALID_TASK_ID", "Task id must be a valid positive number", 400);
    }

    const result = await taskService.getTaskAudits(uId, tId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  getTasks,
  getMyDeletedTasks,
  getSoftDeletedTasks,
  updateTask,
  deleteSoftTask,
  deleteHardTask,
  restoreTask,
  getTaskAudits,
};
