const express = require("express");
const router = express.Router();
const {admin, db} = require("../firebaseAdmin");
const bcrypt = require("bcryptjs");
const validator = require("validator");

// Middleware to check if the user is authenticated
const isAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized access. Token is missing." });
  }

  try {
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;

    // Fetch the user's document from Firestore
    const userDoc = await db.collection("users").doc(userEmail).get();

    if (!userDoc.exists) {
      console.error(`User with email ${userEmail} not found in database.`);
      return res.status(404).json({ error: "User not found in database." });
    }

    const userData = userDoc.data();
    console.log(`User data retrieved: ${JSON.stringify(userData)}`);

    // Attach user information, including the nickname, to the request
    req.user = {
      uid: decodedToken.uid, // Firebase user UID
      email: userData.email, // User's email
      nickname: userData.nickname, // User's nickname from Firestore
      isAdmin: userData.isAdmin, // Include any additional fields if necessary
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

// Middleware for input validation
const validateInput = (req, res, next) => {
  const { email, currentPassword, newPassword, password } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid or missing email." });
  }

  if (currentPassword || newPassword) {
    if (!currentPassword || currentPassword.trim().length < 6) {
      return res.status(400).json({ error: "Current password must be at least 6 characters." });
    }
    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
  }

  if (password && password.trim().length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  next();
};

// Register a user
router.post("/register", async (req, res) => {
  const { email, nickname, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user details in Firestore
    await db.collection("users").doc(email).set({
      email,
      nickname,
      password: hashedPassword,
      isVerified: false,
      isAdmin: false,
      AdminPrivileges: [],
      AuthCode: "",
      isDeactivated: false,
    });

    // Generate a Firebase token for the user
    const token = await admin.auth().createCustomToken(email);

    res.status(201).json({
      message: "User registered successfully.",
      token, // Return the generated token
      user: {
        email,
        nickname,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Verify a user's email
router.get("/verify-email", async (req, res) => {
  const { email } = req.query;
  try {
    const userDoc = await db.collection("users").doc(email).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found." });
    }
    await db.collection("users").doc(email).update({ isVerified: true });
    res.json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("Error verifying email:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Login a user
router.post("/login", async (req, res) => {
  const { idToken } = req.body; // Expect ID token from frontend

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    // Fetch user data from Firestore
    const userDoc = await db.collection("users").doc(email.toLowerCase()).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userDoc.data();

    // Check if account is deactivated
    if (user.isDeactivated) {
      return res.status(403).json({ error: "Account is deactivated." });
    }

    // Include user's verification status in response
    res.json({
      message: "Login successful.",
      user: {
        email: user.email,
        nickname: user.nickname,
        isVerified: user.isVerified,
        isDeactivated: user.isDeactivated,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Reset a user's password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const userDoc = await db.collection("users").doc(email).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection("users").doc(email).update({ password: hashedPassword });
    res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Update a user's password
router.put("/update-password", validateInput, async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  try {
    const userDoc = await db.collection("users").doc(email).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found." });
    }
    const user = userDoc.data();
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection("users").doc(email).update({ password: hashedPassword });
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get user profile
router.get("/profile", isAuthenticated, async (req, res) => {
    try {
        // Since user data is already fetched in isAuthenticated middleware,
        // we can just return it from req.user
        res.json({
            email: req.user.email,
            nickname: req.user.nickname,
            isAdmin: req.user.isAdmin || false,
            isVerified: req.user.isVerified || false,
            isDeactivated: req.user.isDeactivated || false
        });
    } catch (error) {
        console.error('Error in profile route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;