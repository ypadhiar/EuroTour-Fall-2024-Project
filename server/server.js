const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const {admin, db} = require("./firebaseAdmin");

const app = express();

// Middleware
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Initialize in-memory data
const destinations = [];

// Create a function to get destinations
function getDestinations() {
  return destinations;
}

// Export the function and lists
module.exports = { getDestinations };

// Load CSV file into memory with an ID for each destination
function loadDestinations() {
  return new Promise((resolve, reject) => {
    let idCounter = 1;
    fs.createReadStream('data/europe-destinations.csv')
      .pipe(csv())
      .on('data', (row) => {
        const trimmedRow = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [key.trim(), value])
        );
        trimmedRow.id = idCounter++;
        destinations.push(trimmedRow);
      })
      .on('end', () => {
        console.log('CSV file successfully processed with IDs');
        resolve();
      })
      .on('error', (error) => {
        console.error('Error loading destinations:', error);
        reject(error);
      });
  });
}

// Import routes after exporting getDestinations
const destinationRoutes = require('./routes/destinations');
const listRoutes = require('./routes/lists');
const userRoutes = require('./routes/account');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/destinations', destinationRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Start the server after loading data
async function startServer() {
  try {
    await loadDestinations();
    const PORT = process.env.PORT || 6000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();