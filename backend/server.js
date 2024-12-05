require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(bodyParser.json());

const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true, default: null },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, unique: true, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Room = mongoose.model('Room', roomSchema);

const questionSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
});

const Question = mongoose.model('Question', questionSchema);

const resultSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    roomNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const Result = mongoose.model("Result", resultSchema);

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        console.log('No token provided');
        return res.sendStatus(403);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err);
            return res.sendStatus(403);
        }
        req.user = { ...user, id: user.userId };
        next();
    });
};


app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(username)) {
        return res.status(400).json({ message: 'Username cannot contain special characters' });
    }

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword, email });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});


app.post('/api/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, exp: Math.floor(Date.now() / 1000) + (10 * 60 * 60) },
            JWT_SECRET
        );
        const expiry = Math.floor(Date.now() / 1000) + (10 * 60 * 60);

        res.json({ token, userId: user._id, expiry });
    } catch (error) {
        res.status(400).json({ message: 'Error logging in', error: error.message });
    }
});

app.post('/api/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
});

app.get('/api/room/:roomId/questions', authenticateJWT, async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const questions = await Question.find({ roomId });

        res.status(200).json({ room, questions });
    } catch (error) {
        console.error('Error fetching questions:', error.message);
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

app.get("/api/results", async (req, res) => {
    try {
        const results = await Result.find();
        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({ error: "Error fetching results" });
    }
});

app.get("/api/leaderboard", async (req, res) => {
    try {
        const leaderboard = await Result.find()
            .sort({ score: -1 })
            .limit(10);
        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: "Error fetching leaderboard" });
    }
});

app.post('/api/room', authenticateJWT, async (req, res) => {
    try {
        const { roomNumber } = req.body;

        if (!roomNumber) {
            return res.status(400).json({ message: 'Room code is required.' });
        }

        const existingRoom = await Room.findOne({ roomNumber });
        if (existingRoom) {
            return res.status(409).json({ message: 'Room with this code already exists.' });
        }

        const room = new Room({ roomNumber, creator: req.user.id });
        await room.save();

        res.status(201).json({ message: 'Room created successfully.', room });
    } catch (error) {
        console.error('Error creating room:', error.message);
        res.status(500).json({ message: 'Error creating room.', error: error.message });
    }
});

app.post('/api/room/:roomId/question', authenticateJWT, async (req, res) => {
    try {
        const { roomId } = req.params;
        const { question, options, correctAnswer } = req.body;

        if (
            !question ||
            !Array.isArray(options) ||
            options.length !== 4 ||
            options.some(option => !option.trim()) ||
            !correctAnswer
        ) {
            return res.status(400).json({ error: "All fields are required and must be valid." });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const newQuestion = new Question({ roomId, question, options, correctAnswer });
        await newQuestion.save();

        res.status(201).json({ message: 'Question added successfully', question: newQuestion });
    } catch (error) {
        console.error('Error adding question:', error.message);
        res.status(500).json({ message: 'Error adding question', error: error.message });
    }
});

app.post("/api/results", async (req, res) => {
    try {
        const { userName, roomNumber, score, totalQuestions } = req.body;
        const newResult = new Result({ userName, roomNumber, score, totalQuestions });
        await newResult.save();
        res.status(201).json({ message: "Result saved successfully" });
    } catch (err) {
        res.status(500).json({ error: "Error saving result" });
    }
});

app.delete('/api/room/:id', authenticateJWT, async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to delete this room' });
        }
        await
            Question.deleteMany({ roomId: req.params.id });

        await Room.findByIdAndDelete(req.params.id);

        res.json({ message: 'Room and its questions deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting room', error: error.message });
    }
});

app.delete('/api/question/:questionId', authenticateJWT, async (req, res) => {

    try {
        const { questionId } = req.params;

        const deletedQuestion = await Question.findByIdAndDelete(questionId);

        if (!deletedQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error.message);
        res.status(500).json({ message: 'Error deleting question', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
