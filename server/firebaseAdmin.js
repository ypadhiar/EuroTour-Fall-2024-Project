const admin = require("firebase-admin");

// Load service account key
const serviceAccount = require("./lab4-ypadhiar-firebase-adminsdk-n81ss-a550170557.json");

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// Get Firestore instance
const db = admin.firestore();

// Export both admin and db
module.exports = { admin, db };
