const AppError = require('../utils/appError');

const createTask = async (task) => {
    try {
        const newTask = await Task.create(task);
        return newTask;
    } catch (error) {
        throw new AppError(
            "Failed to create task",
            500,
            error.message
        );
    }   
};

const getTasks = async () => {
    try {
        const tasks = await Task.find();
        return tasks;
    } catch (error) {
        throw new AppError(
            "Failed to get tasks",
            500,
            error.message
        );
    }
};

const getTaskById = async (id) => {
    try {
        const task = await Task.findById(id);
        return task;
    } catch (error) {
        throw new AppError(
            "Failed to get task by id",
            500,
            error.message
        );
    }
};

const updateTask = async (id, task) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(id, task, { new: true });
        return updatedTask;
    } catch (error) {
        throw new AppError(
            "Failed to update task",
            500,
            error.message
        );
    }
};

const deleteTask = async (id) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(id);
        return deletedTask;
    } catch (error) {
        throw new AppError(
            "Failed to delete task",
            500,
            error.message
        );
    }
}; 

const deleteSoftTask = async (id) => {
    try {
        const deletedTask = await Task.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        return deletedTask;
    } catch (error) {
        throw new AppError(
            "Failed to delete soft task",
            500,
            error.message
        );
    }
};