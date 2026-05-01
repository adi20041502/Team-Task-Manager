const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

const projectPopulation = [
  { path: 'admin', select: 'name email role' },
  { path: 'team', select: 'name email role' },
];

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

router.post('/', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const teamMemberIds = Array.isArray(req.body.teamMemberIds)
      ? [...new Set(req.body.teamMemberIds.map((value) => String(value || '').trim()).filter(Boolean))]
      : [];

    if (name.length < 2) {
      return res.status(400).json({ message: 'Project name must be at least 2 characters long.' });
    }

    if (req.body.teamMemberIds !== undefined && !Array.isArray(req.body.teamMemberIds)) {
      return res.status(400).json({ message: 'Team members must be provided as a list.' });
    }

    if (teamMemberIds.some((userId) => !isValidObjectId(userId))) {
      return res.status(400).json({ message: 'One or more selected team members are invalid.' });
    }

    const users = teamMemberIds.length
      ? await User.find({ _id: { $in: teamMemberIds } }).select('_id')
      : [];

    if (users.length !== teamMemberIds.length) {
      return res.status(400).json({ message: 'One or more selected team members were not found.' });
    }

    const team = [...new Set([req.user._id.toString(), ...users.map((user) => user._id.toString())])];

    const project = await Project.create({
      name,
      description,
      admin: req.user._id,
      team,
    });

    const createdProject = await Project.findById(project._id).populate(projectPopulation);
    return res.status(201).json(createdProject);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create project right now.' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ team: req.user._id })
      .populate(projectPopulation)
      .sort({ createdAt: -1 });

    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch projects right now.' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id.' });
    }

    const project = await Project.findById(req.params.id).populate(projectPopulation);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'You do not have access to this project.' });
    }

    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch this project right now.' });
  }
});

router.put('/:id', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id.' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the project admin can update this project.' });
    }

    const nextName = req.body.name === undefined ? project.name : String(req.body.name).trim();
    const nextDescription =
      req.body.description === undefined ? project.description : String(req.body.description).trim();

    if (nextName.length < 2) {
      return res.status(400).json({ message: 'Project name must be at least 2 characters long.' });
    }

    project.name = nextName;
    project.description = nextDescription;
    await project.save();

    const updatedProject = await Project.findById(project._id).populate(projectPopulation);
    return res.status(200).json(updatedProject);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update this project right now.' });
  }
});

router.post('/:id/team', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id.' });
    }

    const userId = String(req.body.userId || '');

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the project admin can manage the team.' });
    }

    const user = await User.findById(userId).select('name email role');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (project.team.some((memberId) => memberId.toString() === userId)) {
      return res.status(400).json({ message: 'This user is already on the project team.' });
    }

    project.team.push(user._id);
    await project.save();

    const updatedProject = await Project.findById(project._id).populate(projectPopulation);
    return res.status(200).json(updatedProject);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to add team member right now.' });
  }
});

router.delete('/:id', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id.' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!isProjectAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the project admin can delete this project.' });
    }

    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete this project right now.' });
  }
});

module.exports = router;
