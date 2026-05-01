TEAM TASK MANAGER
=================

Overview
--------
Team Task Manager is a full-stack web application for managing projects, team members, and tasks.
It supports authentication, role-based access control, project management, task assignment, and a
simple dashboard for tracking progress and overdue work.


Core Features
-------------
1. Signup and login with JWT-based authentication
2. Role-based access control with Admin and Member roles
3. Project creation and team management
4. Task creation, assignment, and status tracking
5. Dashboard with project/task counts and overdue visibility
6. Simple React UI connected to REST APIs


Roles
-----
Admin:
- Create projects
- Edit and delete projects they own
- Add team members to their projects
- Create tasks inside their own projects
- Assign tasks to project team members
- Update or delete tasks in their own projects

Member:
- Log in and access assigned projects
- View project details and team members
- View tasks they can access
- Update the status of tasks assigned to them

Important:
- The first account created becomes Admin automatically
- All later accounts are created as Members


Tech Stack
----------
Frontend:
- React
- Vite
- React Router
- Axios

Backend:
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs


Project Structure
-----------------
D:\Project
|- backend
|  |- middleware
|  |- models
|  |- routes
|  |- server.js
|  |- package.json
|
|- frontend
|  |- src
|  |- public
|  |- package.json
|
|- docs
|- README.md
|- README.txt


Main Backend Models
-------------------
User:
- name
- email
- password
- role

Project:
- name
- description
- admin
- team

Task:
- title
- description
- project
- assignedTo
- status
- dueDate
- createdBy


API Summary
-----------
Auth:
- POST /api/auth/signup
- POST /api/auth/login

Users:
- GET /api/users/me
- GET /api/users        (Admin only)

Projects:
- GET /api/projects
- POST /api/projects    (Admin only)
- GET /api/projects/:id
- PUT /api/projects/:id (Project Admin only)
- DELETE /api/projects/:id (Project Admin only)
- POST /api/projects/:id/team (Project Admin only)

Tasks:
- GET /api/tasks
- GET /api/tasks?mine=true
- GET /api/tasks/project/:projectId
- POST /api/tasks       (Project Admin only)
- PUT /api/tasks/:id
- DELETE /api/tasks/:id (Project Admin only)


Frontend Pages
--------------
- /login
- /signup
- /dashboard
- /projects
- /projects/:projectId
- /tasks


Validation and Access Rules
---------------------------
- JWT token is required for protected routes
- Users can only access projects they belong to
- Only project owners can manage project details, team members, and tasks
- Tasks can only be assigned to users who are already on that project team
- Members can only update the status of tasks assigned to them
- Field validation is applied to names, emails, passwords, project names, and task titles


Environment Variables
---------------------
Backend file:
D:\Project\backend\.env

Required values:
MONGO_URI=mongodb://localhost:27017/project-manager
JWT_SECRET=your_secret_key_here_change_it
PORT=5000

Frontend file:
D:\Project\frontend\.env

Required value:
VITE_API_URL=http://localhost:5000


Setup Instructions
------------------
1. Install dependencies
   Backend:
   cd D:\Project\backend
   npm install

   Frontend:
   cd D:\Project\frontend
   npm install

2. Start MongoDB
   Make sure MongoDB is running locally on port 27017, or update MONGO_URI to your own database.

3. Start the backend
   cd D:\Project\backend
   npm start

4. Start the frontend
   cd D:\Project\frontend
   npm run dev

5. Open the frontend in the browser
   Vite will show the local URL, usually:
   http://localhost:5173


Build and Quality Checks
------------------------
Frontend:
- npm run lint
- npm run build

Backend:
- node --check server.js


Typical Usage Flow
------------------
1. Create the first account -> it becomes Admin
2. Create a project
3. Create Member accounts
4. Add members to the project team
5. Create and assign tasks
6. Members update task status
7. Track counts and overdue tasks from the dashboard


