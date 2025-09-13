// Backend Code (server.js) - Run with Node.js, install dependencies: express, mongoose, cors, firebase-admin

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your Firebase Admin SDK service account key
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Auth middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// MongoDB connection (replace with your MongoDB URI)
mongoose.connect('mongodb+srv://sul:084847%23%40AbC@cluster0.3dyz6ya.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true });

// Models
const admissionSchema = new mongoose.Schema({
  userId: String,
  collegeId: Number,
  name: String,
  subject: String,
  email: String,
  phone: String,
  address: String,
  dob: String,
  image: String
});
const Admission = mongoose.model('Admission', admissionSchema);

const reviewSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  collegeId: Number,
  college: String,
  rating: Number,
  comment: String,
  date: Date
});
const Review = mongoose.model('Review', reviewSchema);

const userSchema = new mongoose.Schema({
  userId: String,
  name: String,
  email: String,
  university: String,
  address: String
});
const User = mongoose.model('User', userSchema);

// Admissions Routes
app.post('/api/admissions', authenticate, async (req, res) => {
  const admission = new Admission({
    userId: req.user.uid,
    collegeId: req.body.collegeId,
    ...req.body.formData
  });
  await admission.save();
  res.json(admission);
});

app.get('/api/admissions/my', authenticate, async (req, res) => {
  const admission = await Admission.findOne({ userId: req.user.uid });
  res.json(admission);
});

// Reviews Routes
app.post('/api/reviews', authenticate, async (req, res) => {
  const review = new Review({ ...req.body, userId: req.user.uid, date: new Date() });
  await review.save();
  res.json(review);
});

app.get('/api/reviews', async (req, res) => {
  const reviews = await Review.find();
  res.json(reviews);
});

// Users Routes
app.get('/api/users/my', authenticate, async (req, res) => {
  let user = await User.findOne({ userId: req.user.uid });
  if (!user) {
    user = new User({
      userId: req.user.uid,
      name: req.user.name,
      email: req.user.email,
      university: '',
      address: ''
    });
    await user.save();
  }
  res.json(user);
});

app.put('/api/users', authenticate, async (req, res) => {
  const user = await User.findOneAndUpdate({ userId: req.user.uid }, req.body, { new: true });
  res.json(user);
});

app.listen(5000, () => console.log('Backend server running on http://localhost:5000'));