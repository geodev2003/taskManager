const taskService = require('../services/task.service');

const createTask = async (req, res) => {
    try {
        const task = await taskService.createTask(req.body);
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({
            "status": "error",
            "message": "Failed to create task",
            "error": error.message
        });
    }
};

const getTasks = async (req, res) => {
    try {
        const tasks = await taskService.getTasks();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({
            "status": "error",
            "message": "Failed to get tasks",
            "error": error.message
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({
            "status": "error",
            "message": "Failed to get task by id",
            "error": error.message
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({
            "status": "error",
            "message": "Failed to update task",
            "error": error.message
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await taskService.deleteTask(req.params.id);
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({
            "status": "error",
            "message": "Failed to delete task",
            "error": error.message
        });
    }
};

const deleteSoftTask = async (req, res) => {
    try {
        const task = await taskService.deleteSoftTask(req.params.id);
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({
            "status": "error",
            "message": "Failed to delete soft task",
            "error": error.message
        });
    }
};

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask
};