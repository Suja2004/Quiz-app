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
    password: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, default: null },
});

const User = mongoose.model('User', userSchema);

const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, unique: true, required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [
        {
            no: { type: Number, required: true },
            question: String,
            options: [String],
            correctAnswer: String,
        },
    ],
});

const Room = mongoose.model('Room', roomSchema);

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

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '10h' });
        const expiry = Date.now() + 36000000;

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
        const rooms = await Room.find({}).select('-questions.correctAnswer');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
});

app.post('/api/room', authenticateJWT, async (req, res) => {
    const { roomNumber } = req.body;

    if (!roomNumber) {
        return res.status(400).json({ message: 'Room number is required.' });
    }

    if (!req.user || !req.user.id) {
        return res.status(403).json({ message: 'User ID is missing in token.' });
    }

    try {
        const room = new Room({ roomNumber, creator: req.user.id });
        await room.save();
        res.status(201).json({ message: 'Room created successfully.', room });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'Error creating room.', error: error.message });
    }
});

app.post('/api/room/questions/:id', authenticateJWT, async (req, res) => {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: 'Questions must be an array.' });
    }

    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        for (const newQuestion of questions) {
            if (room.questions.some(q => q.no === newQuestion.no)) {
                return res.status(400).json({
                    message: `Question number ${newQuestion.no} already exists in the room.`,
                });
            }
        }

        room.questions.push(...questions);
        await room.save();

        res.status(200).json({ message: 'Questions added successfully.', room });
    } catch (error) {
        console.error('Error adding questions:', error);
        res.status(500).json({ message: 'Error adding questions.', error: error.message });
    }
});


app.put('/api/room/question/:id', authenticateJWT, async (req, res) => {
    const { qno, question, options, correctAnswer } = req.body;
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        const questionIndex = room.questions.findIndex(q => q.no === qno);
        if (questionIndex === -1) {
            return res.status(404).json({ message: 'Question not found' });
        }
        if (question) room.questions[questionIndex].question = question;
        if (options) room.questions[questionIndex].options = options;
        if (correctAnswer) room.questions[questionIndex].correctAnswer = correctAnswer;
        await room.save();
        res.status(200).json({ message: 'Question updated successfully', room });
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ message: 'Error updating question', error: error.message });
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

        await Room.findByIdAndDelete(req.params.id);
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting room', error: error.message });
    }
});

app.delete('/api/room/question/:id', authenticateJWT, async (req, res) => {
    const { qno } = req.body;
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const updatedQuestions = room.questions.filter(q => q.no !== qno);

        updatedQuestions.forEach((question, index) => {
            question.no = index + 1;
        });

        room.questions = updatedQuestions;

        await room.save();

        res.status(200).json({ message: 'Question removed and numbering updated successfully', room });
    } catch (error) {
        console.error('Error deleting and updating question:', error);
        res.status(500).json({ message: 'Error deleting and updating question', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
