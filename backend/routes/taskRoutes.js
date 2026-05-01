const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

const getId = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }

  return value.toString();
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const isProjectMember = (project, userId) =>
  project.team.some((member) => getId(member) === userId.toString());

const isProjectAdmin = (project, userId) => getId(project.admin) === userId.toString();

const isTaskAssignee = (task, userId) => getId(task.assignedTo) === userId.toString();

const isValidStatus = (status) => ['Todo', 'In Progress', 'Done'].includes(status);

const taskPopulation = (query) =>
  query
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('project', 'name admin');

const buildTaskQuery = async (req) => {
  const query = {};
  const projectId = req.query.projectId || '';

  if (projectId) {
    if (!isValidObjectId(projectId)) {
      return { error: 'Invalid project id.' };
    }

    const project = await Project.findById(projectId).select('admin team');

    if (!project) {
      return { error: 'Project not found.', status: 404 };
    }

    if (!isProjectMember(project, req.user._id)) {
      return { error: 'You do not have access to this project.', status: 403 };
    }

    query.project = project._id;
  } else {
    const accessibleProjects = await Project.find({ team: req.user._id }).select('_id');
    query.project = { $in: accessibleProjects.map((project) => project._id) };
  }

  if (req.query.mine === 'true') {
    query.assignedTo = req.user._id;
  }

  return { query };
};

router.post('/', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();
    const projectId = String(req.body.projectId || '');
    const assignedTo = String(req.body.assignedTo || '');
    const status = req.body.status ? String(req.body.status) : 'Todo';
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;

    if (title.length < 2) {
      return res.status(400).json({ message: 'Task title must be at least 2 characters long.' });
    }

    if (!isValidObjectId(projectId) || !isValidObjectId(assignedTo)) {
      return res.status(400).json({ message: 'Project and assignee are required.' });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({ message: 'Invalid task status.' });
    }

    if (req.body.dueDate && Number.isNaN(dueDate.getTime())) {
      return res.status(400).json({ message: 'Please provide a valid due date.' });
    }

    const project = await Project.findById(projectId).select('admin team');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the project admin can create tasks.' });
    }

    if (!isProjectMember(project, assignedTo)) {
      return res.status(400).json({ message: 'Tasks can only be assigned to project team members.' });
    }

    const task = await Task.create({
      title,
      description,
      project: project._id,
      assignedTo,
      status,
      dueDate,
      createdBy: req.user._id,
    });

    const createdTask = await taskPopulation(Task.findById(task._id));
    return res.status(201).json(await createdTask);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create task right now.' });
  }
});

router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.projectId)) {
      return res.status(400).json({ message: 'Invalid project id.' });
    }

    const project = await Project.findById(req.params.projectId).select('admin team');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'You do not have access to this project.' });
    }

    const tasks = await taskPopulation(
      Task.find({ project: req.params.projectId }).sort({ dueDate: 1, createdAt: -1 })
    );

    return res.status(200).json(await tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch project tasks right now.' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { query, error, status } = await buildTaskQuery(req);

    if (error) {
      return res.status(status || 400).json({ message: error });
    }

    const tasks = await taskPopulation(Task.find(query).sort({ dueDate: 1, createdAt: -1 }));
    return res.status(200).json(await tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch tasks right now.' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task id.' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const project = await Project.findById(task.project).select('admin team');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'You do not have access to this task.' });
    }

    const projectAdmin = isProjectAdmin(project, req.user._id);
    const taskAssignee = isTaskAssignee(task, req.user._id);

    if (!projectAdmin && !taskAssignee) {
      return res.status(403).json({ message: 'You do not have permission to update this task.' });
    }

    const allowedFields = projectAdmin
      ? ['title', 'description', 'assignedTo', 'status', 'dueDate']
      : ['status'];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      updates.title = String(updates.title).trim();
      if (updates.title.length < 2) {
        return res.status(400).json({ message: 'Task title must be at least 2 characters long.' });
      }
    }

    if (updates.description !== undefined) {
      updates.description = String(updates.description).trim();
    }

    if (updates.status !== undefined && !isValidStatus(String(updates.status))) {
      return res.status(400).json({ message: 'Invalid task status.' });
    }

    if (updates.assignedTo !== undefined) {
      if (!projectAdmin) {
        return res.status(403).json({ message: 'Only the project admin can reassign tasks.' });
      }

      if (!isValidObjectId(String(updates.assignedTo))) {
        return res.status(400).json({ message: 'Invalid assignee.' });
      }

      if (!isProjectMember(project, String(updates.assignedTo))) {
        return res.status(400).json({ message: 'Tasks can only be assigned to project team members.' });
      }
    }

    if (updates.dueDate !== undefined) {
      if (!updates.dueDate) {
        updates.dueDate = null;
      } else {
        const parsedDate = new Date(updates.dueDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: 'Please provide a valid due date.' });
        }
        updates.dueDate = parsedDate;
      }
    }

    Object.assign(task, updates);
    await task.save();

    const updatedTask = await taskPopulation(Task.findById(task._id));
    return res.status(200).json(await updatedTask);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update this task right now.' });
  }
});

router.delete('/:id', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task id.' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const project = await Project.findById(task.project).select('admin team');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the project admin can delete tasks.' });
    }

    await Task.findByIdAndDelete(task._id);
    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete this task right now.' });
  }
});

module.exports = router;
