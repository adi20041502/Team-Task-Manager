const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required.'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters long.'],
      maxlength: [100, 'Project name cannot exceed 100 characters.'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Project description cannot exceed 500 characters.'],
      default: '',
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
