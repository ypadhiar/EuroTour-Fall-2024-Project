const express = require('express');
const router = express.Router();
const { lists, getDestinations } = require('../server'); // Use lists from the server
const {admin, db} = require("../firebaseAdmin");

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

// POST: Create a new list
router.post('/', isAuthenticated, async (req, res) => {
    const { name, description, isVisible } = req.body;

    // Validate required attributes
    if (!name || typeof name !== "string" || name.length > 50 || name.includes('/')) {
        return res.status(400).json({ error: 'Invalid list name. Must be a string, up to 50 characters long, and cannot contain "/".' });
    }

    // Check if the list already exists
    const listDoc = db.collection('lists').doc(name);
    const existingList = await listDoc.get();
    if (existingList.exists) {
        return res.status(400).json({ error: `List with the name "${name}" already exists.` });
    }

    // Create the new list document
    try {
        const newList = {
            name,
            description: description || "", // Optional field
            creatorNickname: req.user.nickname || req.user.email, // Get from authenticated user
            creatorEmail: req.user.email, // Add user's email
            isVisible: Boolean(isVisible), // Convert to boolean and use the value from request
            destinations: [], // Initially empty
            creationDate: new Date().toISOString(),
            averageRating: 0, // Default average rating
            reviews: [] // Empty array for reviews
        };

        await listDoc.set(newList);
        res.status(201).json({ message: `List "${name}" created successfully.`, list: newList });
    } catch (error) {
        console.error("Error creating list:", error.message);
        res.status(500).json({ error: "Failed to create list." });
    }
});

// PUT: Update list visibility
router.put('/:name/visibility', async (req, res) => {
    const { name } = req.params;

    try {
        const listDoc = db.collection('lists').doc(name);
        const list = await listDoc.get();

        if (!list.exists) {
            return res.status(404).json({ error: `List "${name}" not found.` });
        }

        await listDoc.update({ isVisible: true });
        res.status(200).json({ message: `List "${name}" visibility set to public.` });
    } catch (error) {
        console.error("Error updating list visibility:", error.message);
        res.status(500).json({ error: "Failed to update visibility." });
    }
});


// PUT: Add destinations to a list
router.put('/:name', async (req, res) => {
    console.log(`PUT request for ${req.url}`);
    const { name } = req.params;
    const { destinationIds } = req.body;

    console.log(`Received request to update list "${name}" with destination IDs:`, destinationIds);

    // Validate input: destinationIds must be an array
    if (!Array.isArray(destinationIds)) {
        console.warn(`Invalid input for list "${name}":`, destinationIds);
        return res.status(400).json({ error: 'Destination IDs must be an array' });
    }

    try {
        // Get the list document from Firestore
        const listDoc = db.collection('lists').doc(name);
        const list = await listDoc.get();

        if (!list.exists) {
            console.warn(`List "${name}" does not exist`);
            return res.status(404).json({ error: `List "${name}" not found` });
        }

        // Get current destinations array
        const currentDestinations = list.data().destinations || [];

        // Combine current and new destinations, removing duplicates
        const updatedDestinations = Array.from(new Set([...currentDestinations, ...destinationIds]));

        // Update the list document in Firestore
        await listDoc.update({ destinations: updatedDestinations });

        console.log(`List "${name}" updated successfully with IDs:`, updatedDestinations);
        res.status(200).json({ 
            message: `List "${name}" updated successfully`,
            destinations: updatedDestinations
        });

    } catch (error) {
        console.error("Error updating list:", error.message);
        res.status(500).json({ error: "Failed to update list" });
    }
});

// GET: Retrieve destinations in a list
router.get('/:name', async (req, res) => {
    console.log(`GET request for ${req.url}`);
    const { name } = req.params;

    console.log(`Received request to retrieve destination IDs for list "${name}"`);

    try {
        // Get the list document
        const listDoc = db.collection('lists').doc(name);
        const list = await listDoc.get();

        if (!list.exists) {
            console.warn(`List "${name}" does not exist`);
            return res.status(404).json({ error: `List "${name}" not found` });
        }

        const destinations = list.data().destinations || [];
        console.log(`Retrieved destination IDs for list "${name}":`, destinations);

        res.status(200).json({ destinations });
    } catch (error) {
        console.error("Error retrieving list:", error.message);
        res.status(500).json({ error: "Failed to retrieve list" });
    }
});

// DELETE: Remove a list
router.delete('/:name', isAuthenticated, async (req, res) => {
    const { name } = req.params;

    try {
        const listRef = db.collection('lists').doc(decodeURIComponent(name));
        const list = await listRef.get();

        if (!list.exists) {
            return res.status(404).json({ error: `List "${name}" not found` });
        }

        // Check if the user is the creator of the list
        const listData = list.data();
        if (listData.creatorEmail !== req.user.email) {
            return res.status(403).json({ error: 'You do not have permission to delete this list.' });
        }

        await listRef.delete();
        res.status(200).json({ message: `List "${name}" deleted successfully` });

    } catch (error) {
        console.error("Error deleting list:", error);
        res.status(500).json({ error: "Failed to delete list" });
    }
});

// GET: Get full details for destinations in a list
router.get('/:name/details', async (req, res) => {
    console.log(`GET request for ${req.url}`);
    const { name } = req.params;

    console.log(`Received request to get details for list "${name}"`);

    try {
        // Get the list document from Firestore
        const listDoc = db.collection('lists').doc(name);
        const list = await listDoc.get();

        if (!list.exists) {
            console.warn(`List "${name}" does not exist`);
            return res.status(404).json({ error: `List "${name}" not found` });
        }

        // Get the destinations array from the list document
        const destinationIds = list.data().destinations || [];

        // Get the destinations collection
        const destinationsRef = db.collection('destinations');
        
        // Get details for each destination in parallel
        const destinationPromises = destinationIds.map(async (id) => {
            const destDoc = await destinationsRef.doc(id).get();
            if (!destDoc.exists) return null;
            
            const destination = destDoc.data();
            return {
                Destination: destination.Destination,
                Region: destination.Region,
                Country: destination.Country,
                Category: destination.Category,
                Latitude: destination.Latitude,
                Longitude: destination.Longitude,
                "Approximate Annual Tourists": destination["Approximate Annual Tourists"],
                Currency: destination.Currency,
                "Majority Religion": destination["Majority Religion"],
                "Famous Foods": destination["Famous Foods"],
                Language: destination.Language,
                "Best Time to Visit": destination["Best Time to Visit"],
                "Cost of Living": destination["Cost of Living"],
                Safety: destination.Safety,
                "Cultural Significance": destination["Cultural Significance"],
                Description: destination.Description
            };
        });

        // Wait for all destination details to be fetched
        const details = (await Promise.all(destinationPromises)).filter(Boolean);

        res.status(200).json(details);
    } catch (error) {
        console.error("Error retrieving list details:", error.message);
        res.status(500).json({ error: "Failed to retrieve list details" });
    }
});

// GET: Get all lists
router.get('/', async (req, res) => {
    console.log('GET /api/lists - Fetching all lists');
    try {
        // Get reference to lists collection
        const listsRef = db.collection('lists');
        
        // Get all documents in the collection
        const snapshot = await listsRef.get();
        
        // Convert the snapshot to an array of list data
        const lists = [];
        snapshot.forEach(doc => {
            const listData = doc.data();
            lists.push({
                name: doc.id,
                description: listData.description,
                creatorNickname: listData.creatorNickname,
                creatorEmail: listData.creatorEmail,
                isVisible: listData.isVisible,
                destinations: listData.destinations || [],
                creationDate: listData.creationDate,
                averageRating: listData.averageRating,
                reviews: listData.reviews || []
            });
        });
        
        console.log(`Retrieved ${lists.length} lists from database`);
        console.log('Lists:', lists);
        
        res.status(200).json(lists);
    } catch (error) {
        console.error("Error retrieving lists:", error.message);
        res.status(500).json({ error: "Failed to retrieve lists" });
    }
});

// Route to get a saved list (added from list.js)
router.get('/savedList', (req, res) => {
    const listName = req.query.ListName;

    if (lists.hasOwnProperty(listName)) {
        res.json(lists[listName]);
    } else {
        res.status(404).json({ error: 'List does not exist.' });
    }
});

// Route to delete a saved list by name (added from list.js)
router.delete('/savedList', (req, res) => {
    const listName = req.query.ListName;

    if (lists.hasOwnProperty(listName)) {
        delete lists[listName];
        res.json({ message: 'List deleted successfully.' });
    } else {
        res.status(404).json({ error: 'List does not exist.' });
    }
});

// Add a review to a list
router.post("/:listName/reviews", isAuthenticated, async (req, res) => {
    const { listName } = req.params;
    const { rating, comment } = req.body;

    // Validate rating and comment
    if (!rating || rating < 0 || rating > 5) {
        return res.status(400).json({ error: "Rating must be a number between 0 and 5." });
    }
    if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
        return res.status(400).json({ error: "Comment must be a non-empty string." });
    }

    try {
        const listDoc = db.collection("lists").doc(listName);
        const list = await listDoc.get();

        // Check if the list exists
        if (!list.exists) {
            return res.status(404).json({ error: `List "${listName}" not found.` });
        }

        // Create the review object
        const review = {
            rating: Number(rating),
            comment,
            userName: req.user.nickname || req.user.email,
            createdDate: new Date().toISOString(),
            isVisible: true
        };

        // Add the review to the reviews array field
        await listDoc.update({
            reviews: admin.firestore.FieldValue.arrayUnion(review)
        });

        // Get updated list data and calculate new average rating
        const updatedList = await listDoc.get();
        const reviews = updatedList.data().reviews || [];
        const totalRating = reviews.reduce((sum, r) => sum + Number(r.rating), 0);
        const averageRating = Number((totalRating / reviews.length).toFixed(1));

        // Update the list's average rating
        await listDoc.update({ averageRating });

        res.status(201).json({
            message: "Review added successfully.",
            review,
            averageRating
        });
    } catch (error) {
        console.error("Error adding review:", error.message);
        res.status(500).json({ error: "Failed to add review." });
    }
});

// Get all reviews for a list
router.get("/:listName/reviews", async (req, res) => {
    const { listName } = req.params;

    try {
        const listDoc = db.collection("lists").doc(listName);
        const list = await listDoc.get();

        if (!list.exists) {
            return res.status(404).json({ error: `List "${listName}" not found.` });
        }

        const allReviews = list.data().reviews || [];
        // Filter out invisible reviews
        const visibleReviews = allReviews.filter(review => review.isVisible !== false);
        res.json(visibleReviews);
    } catch (error) {
        console.error("Error fetching reviews:", error.message);
        res.status(500).json({ error: "Failed to fetch reviews." });
    }
});

// PUT: Add destination to a list
router.put('/:name/destinations', isAuthenticated, async (req, res) => {
    const { name } = req.params;
    const { destinationId } = req.body;

    if (!destinationId) {
        return res.status(400).json({ error: 'Destination ID is required' });
    }

    try {
        const listDoc = db.collection('lists').doc(name);
        const list = await listDoc.get();

        if (!list.exists) {
            return res.status(404).json({ error: `List "${name}" not found.` });
        }

        const listData = list.data();
        
        // Check if destination already exists in the list
        if (listData.destinations.includes(destinationId)) {
            return res.status(400).json({ error: 'Destination already in list' });
        }

        // Add the destination ID to the list
        await listDoc.update({
            destinations: [...listData.destinations, destinationId]
        });

        res.status(200).json({ message: 'Destination added to list successfully' });
    } catch (error) {
        console.error("Error adding destination to list:", error.message);
        res.status(500).json({ error: "Failed to add destination to list" });
    }
});

// PUT: Update list details
router.put('/:name/update', isAuthenticated, async (req, res) => {
    const { name } = req.params;
    const { name: newName, description, isVisible } = req.body;

    try {
        const listDoc = db.collection('lists').doc(name);
        const list = await listDoc.get();

        if (!list.exists) {
            return res.status(404).json({ error: `List "${name}" not found.` });
        }

        // Check if the user is the creator of the list
        const listData = list.data();
        if (listData.creatorEmail !== req.user.email) {
            return res.status(403).json({ error: 'You do not have permission to edit this list.' });
        }

        // Get current timestamp
        const updatedDate = new Date().toISOString();

        // If name is being changed, need to create new doc and delete old one
        if (newName && newName !== name) {
            // Check if new name already exists
            const newListDoc = db.collection('lists').doc(newName);
            const existingList = await newListDoc.get();
            if (existingList.exists) {
                return res.status(400).json({ error: `List "${newName}" already exists.` });
            }

            // Create new document with updated data
            await newListDoc.set({
                ...listData,
                name: newName,
                description: description || listData.description,
                isVisible: isVisible !== undefined ? isVisible : listData.isVisible,
                creationDate: updatedDate
            });

            // Delete old document
            await listDoc.delete();
        } else {
            // Update description, visibility, and creation date
            await listDoc.update({
                description: description || listData.description,
                isVisible: isVisible !== undefined ? isVisible : listData.isVisible,
                creationDate: updatedDate
            });
        }

        res.status(200).json({ message: 'List updated successfully' });
    } catch (error) {
        console.error('Error updating list:', error);
        res.status(500).json({ error: 'Failed to update list' });
    }
});

// DELETE: Remove destination from list
router.delete('/:listName/destinations/:destinationId', isAuthenticated, async (req, res) => {
    const { listName, destinationId } = req.params;

    try {
        const listDoc = db.collection('lists').doc(listName);
        const list = await listDoc.get();

        if (!list.exists) {
            return res.status(404).json({ error: `List "${listName}" not found.` });
        }

        // Check if the user is the creator of the list
        const listData = list.data();
        if (listData.creatorEmail !== req.user.email) {
            return res.status(403).json({ error: 'You do not have permission to modify this list.' });
        }

        // Remove the destination from the array
        const updatedDestinations = listData.destinations.filter(id => String(id) !== String(destinationId));

        // Update the list with the new destinations array
        await listDoc.update({
            destinations: updatedDestinations
        });

        res.status(200).json({ 
            message: 'Destination removed successfully',
            destinations: updatedDestinations
        });
    } catch (error) {
        console.error('Error removing destination:', error);
        res.status(500).json({ error: 'Failed to remove destination from list' });
    }
});

module.exports = router;