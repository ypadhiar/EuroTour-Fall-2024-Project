const express = require('express');
const router = express.Router();
const { admin, db } = require('../firebaseAdmin');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ error: "Unauthorized access. Token is missing." });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userDoc = await db.collection("users").doc(decodedToken.email).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found." });
        }

        const userData = userDoc.data();
        if (!userData.isAdmin) {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        req.user = {
            email: decodedToken.email,
            ...userData
        };
        next();
    } catch (error) {
        console.error("Admin authentication error:", error);
        res.status(401).json({ error: "Invalid or expired token." });
    }
};

// Get all users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                email: doc.id,
                nickname: userData.nickname,
                isAdmin: userData.isAdmin || false,
                isDeactivated: userData.isDeactivated || false
            });
        });

        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Toggle user account status (activate/deactivate)
router.put('/users/:email/status', isAdmin, async (req, res) => {
    const { email } = req.params;
    const { isDeactivated } = req.body;

    try {
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        await userRef.update({ isDeactivated });
        res.json({ message: `User ${isDeactivated ? 'deactivated' : 'activated'} successfully` });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ error: "Failed to update user status" });
    }
});

// Toggle user admin status
router.put('/users/:email/admin', isAdmin, async (req, res) => {
    const { email } = req.params;
    const { isAdmin: newAdminStatus } = req.body;

    try {
        // Check if the user making the request is trying to remove their own admin status
        if (email === req.user.email && !newAdminStatus) {
            return res.status(400).json({ 
                error: "Administrators cannot remove their own admin status" 
            });
        }

        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update the admin status
        await userRef.update({ 
            isAdmin: newAdminStatus 
        });

        console.log(`Updated admin status for ${email} to ${newAdminStatus}`);
        
        res.json({ 
            message: `User admin status updated successfully`,
            email: email,
            newAdminStatus: newAdminStatus
        });
    } catch (error) {
        console.error("Error updating admin status:", error);
        res.status(500).json({ 
            error: "Failed to update admin status",
            details: error.message 
        });
    }
});

// Get all reviews
router.get('/reviews', isAdmin, async (req, res) => {
    try {
        const listsSnapshot = await db.collection('lists').get();
        const reviews = [];

        listsSnapshot.forEach(doc => {
            const listData = doc.data();
            if (listData.reviews) {
                listData.reviews.forEach((review, index) => {
                    reviews.push({
                        id: index,
                        listName: doc.id,
                        userName: review.userName,
                        rating: review.rating,
                        comment: review.comment,
                        isVisible: review.isVisible
                    });
                });
            }
        });

        res.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// Toggle review visibility
router.put('/reviews/:listName/:reviewId/visibility', isAdmin, async (req, res) => {
    const { listName, reviewId } = req.params;
    const { isVisible } = req.body;

    try {
        const listRef = db.collection('lists').doc(listName);
        const listDoc = await listRef.get();

        if (!listDoc.exists) {
            return res.status(404).json({ error: "List not found" });
        }

        const listData = listDoc.data();
        const reviewIndex = parseInt(reviewId);

        if (!listData.reviews || !listData.reviews[reviewIndex]) {
            return res.status(404).json({ error: "Review not found" });
        }

        // Update the specific review's visibility
        listData.reviews[reviewIndex].isVisible = isVisible;

        await listRef.update({ reviews: listData.reviews });
        res.json({ message: "Review visibility updated successfully" });
    } catch (error) {
        console.error("Error updating review visibility:", error);
        res.status(500).json({ error: "Failed to update review visibility" });
    }
});

module.exports = router;
