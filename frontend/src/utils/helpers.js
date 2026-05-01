export const getEntityId = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'object') {
    return value._id || value.id || '';
  }

  return value;
};

export const formatDate = (value) => {
  if (!value) {
    return 'No due date';
  }

  return new Date(value).toLocaleDateString();
};

export const isOverdue = (task) => {
  if (!task?.dueDate || task.status === 'Done') {
    return false;
  }

  return new Date(task.dueDate).getTime() < Date.now();
};

export const isProjectOwner = (project, userId) => getEntityId(project?.admin) === userId;

export const statusClassName = (status) => {
  if (status === 'In Progress') {
    return 'status-in-progress';
  }

  if (status === 'Done') {
    return 'status-done';
  }

  return 'status-todo';
};
