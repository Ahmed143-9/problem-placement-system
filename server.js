const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper function to read users from localStorage-like file
async function readUsers() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'users.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper function to write users to localStorage-like file
async function writeUsers(users) {
  await fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2));
}

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await readUsers();
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load users'
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const users = await readUsers();
    const newUser = req.body;
    
    // Validation
    if (!newUser.name || !newUser.username || !newUser.email) {
      return res.status(400).json({
        success: false,
        error: 'Name, username, and email are required'
      });
    }
    
    // Check if username or email already exists
    const existingUser = users.find(u => u.username === newUser.username || u.email === newUser.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    // Add new user
    const user = {
      id: Date.now(), // Simple ID generation
      ...newUser,
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    await writeUsers(users);
    
    res.status(201).json({
      success: true,
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const users = await readUsers();
    const userId = parseInt(req.params.id);
    const updatedData = req.body;
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update user
    users[userIndex] = {
      ...users[userIndex],
      ...updatedData
    };
    
    await writeUsers(users);
    
    res.json({
      success: true,
      user: users[userIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// New endpoint to get user password for admin users
app.get('/api/users/:id/password', async (req, res) => {
  try {
    const users = await readUsers();
    const userId = parseInt(req.params.id);
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Return the password - in a real system, this would check if the requesting user is an admin
    res.json({
      success: true,
      password: user.password
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve password'
    });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const users = await readUsers();
    const userId = parseInt(req.params.id);
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Remove user
    users.splice(userIndex, 1);
    await writeUsers(users);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

app.patch('/api/users/:id/toggle-status', async (req, res) => {
  try {
    const users = await readUsers();
    const userId = parseInt(req.params.id);
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Toggle status
    users[userIndex].status = users[userIndex].status === 'active' ? 'inactive' : 'active';
    await writeUsers(users);
    
    res.json({
      success: true,
      user: users[userIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to toggle user status'
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const users = await readUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Remove password from response for security
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      token: 'fake-jwt-token-' + Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});