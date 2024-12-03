const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session'); 

const app = express();
const PORT = 5000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname))); 

app.use(session({
    secret: 'yourSecretKey', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

mongoose.connect('mongodb://localhost:27017/MSTproject')
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection failed:", error));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    gender: String
});

const User = mongoose.model('RegUser', userSchema);

function isAuthenticated(req, res, next) {
    if (req.session && req.session.isLoggedIn) {
        return next(); 
    }
    return res.redirect('/login.html');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'birds.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/myadoptions.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'myadoptions.html'));
});


app.post('/register', async (req, res) => {
    try {
        const { uname, email, password, gr } = req.body;
        const newUser = new User({ name: uname, email, password: password, gender: gr });
        await newUser.save();
        
        res.status(200).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user" });
        console.error(error);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ name: username });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        
        if (password !== user.password)  {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        req.session.isLoggedIn = true;
        req.session.username = username;
        res.status(200).json({ message: "Login successful!" });

    } catch (error) {
        res.status(500).json({ message: "Error logging in" });
        console.error(error);
    }
});

app.get('/getUser', (req, res) => {
    if (req.session && req.session.isLoggedIn) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ message: "User not logged in" });
    }
});

const adoptionSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    address: String,
    selectedBird: String,
    experience: String
});

const Adoption = mongoose.model('Adoption', adoptionSchema);

app.get('/adopt.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'adopt.html'));
});

app.post('/adoption', async (req, res) => {
    try {
        console.log("Request body data:", req.body);
        const { name, email, phone, address, selectedBird, experience } = req.body;

        const newApplication = new Adoption({
            name,
            email,
            phone,
            address,
            selectedBird,
            experience
        });

        await newApplication.save();
        console.log("Application saved:", newApplication); 
        res.status(200).json({ message: "Adoption application submitted successfully!" });
    } catch (error) {
        console.error("Error submitting adoption application:", error);
        res.status(500).json({ message: "Error submitting adoption application" });
    }
});
// Admin Authentication (for simplicity, we can hardcode admin credentials)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdminLoggedIn = true; // Set admin session
        return res.status(200).json({ message: "Admin login successful!" });
    }

    return res.status(401).json({ message: "Invalid admin credentials" });
});

// Middleware to check if admin is authenticated
// Middleware to check if admin is authenticated
function isAdminAuthenticated(req, res, next) {
    if (req.session && req.session.isAdminLoggedIn) {
        return next();
    }
    return res.status(403).json({ message: "Admin not authenticated" });
}

// Delete an adoption
app.delete('/admin/adoptions/:id', isAdminAuthenticated, async (req, res) => {
    const adoptionId = req.params.id;

    try {
        await Adoption.findByIdAndDelete(adoptionId);
        res.status(200).json({ message: "Adoption deleted successfully." });
    } catch (error) {
        console.error("Error deleting adoption:", error);
        res.status(500).json({ message: "Error deleting adoption." });
    }
});


// Get all users
app.get('/admin/users', isAdminAuthenticated, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
});

// Get all adoption applications
app.get('/admin/adoptions', isAdminAuthenticated, async (req, res) => {
    try {
        const adoptions = await Adoption.find();
        res.json(adoptions);
    } catch (error) {
        console.error("Error fetching adoptions:", error);
        res.status(500).json({ message: "Error fetching adoptions" });
    }
});

// Delete a user
app.delete('/admin/users/:id', isAdminAuthenticated, async (req, res) => {
    const userId = req.params.id;

    try {
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Error deleting user." });
    }
});

app.get('/myadoptions', async (req, res) => {
    const username = req.query.username;
    console.log("Fetching adoptions for username:", username); // Log the username

    if (!username) {
        return res.status(400).json({ message: "Username not provided" });
    }

    try {
        const userAdoptions = await Adoption.find({ name: username });
        console.log("Adoptions found:", userAdoptions); // Log found adoptions

        if (userAdoptions.length === 0) {
            console.log("No adoptions found for this user.");
        }

        res.json(userAdoptions); // Send user-specific adoption data as JSON
    } catch (error) {
        console.error("Error fetching user adoptions:", error);
        res.status(500).json({ message: "Error fetching adoptions" });
    }
});

app.delete('/deleteAdoption/:id', async (req, res) => {
    const adoptionId = req.params.id;

    try {
        const result = await Adoption.findByIdAndDelete(adoptionId);
        
        if (!result) {
            return res.status(404).json({ message: "Adoption not found." });
        }

        res.status(200).json({ message: "Adoption deleted successfully." });
    } catch (error) {
        console.error("Error deleting adoption:", error);
        res.status(500).json({ message: "Error deleting adoption." });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out" });
        }
        res.redirect('/login.html');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});