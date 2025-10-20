const express = require("express");
const router = express.Router();
const { getDestinations } = require("../server");
const {admin, db} = require("../firebaseAdmin");
const stringSimilarity = require('string-similarity');

// GET method to get all countries in the array/csv file  
router.get('/countries', (req, res) => {
  console.log(`GET request for ${req.url}`)
  const destinations = getDestinations();
  const countries = [...new Set(
    destinations
      .map(dest => dest.Country)
      .filter(country => typeof country === 'string' && country.trim() !== '')
  )];
  res.json(countries);
});

// Helper function to normalize text
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to check if strings match with up to 2 character differences
function isMatch(searchTerm, value) {
  if (!searchTerm) return true; // Empty search term matches everything
  
  const normalizedSearch = normalizeText(searchTerm);
  const normalizedValue = normalizeText(value);
  
  // Check if value contains search term (case-insensitive)
  if (normalizedValue.includes(normalizedSearch)) return true;
  
  // Count character differences
  let differences = 0;
  const maxLength = Math.max(normalizedSearch.length, normalizedValue.length);
  
  // Compare characters and count differences
  for (let i = 0; i < maxLength && differences <= 2; i++) {
    if (normalizedSearch[i] !== normalizedValue[i]) {
      differences++;
    }
  }
  
  return differences <= 2;
}

// Route to search for destinations
router.get("/search", (req, res) => {
  console.log(`GET request for ${req.url}`);
  const { name, region, country, n } = req.query;
  const destinations = getDestinations();
  
  // Validate at least one search criterion
  if (!name && !region && !country) {
    return res.status(400).json({ 
      error: 'At least one search criterion (name, region, or country) must be provided'
    });
  }

  // Parse limit, default to 5 if not specified
  const limit = n ? parseInt(n, 10) : 5;
  
  if (isNaN(limit) || limit < 1) {
    return res.status(400).json({
      error: 'Invalid value for n. Must be a positive number.'
    });
  }

  console.log("Search criteria:", {
    name: name || '(empty)',
    region: region || '(empty)',
    country: country || '(empty)',
    limit: limit
  });

  // Filter destinations based on all criteria using soft matching
  const matches = destinations.filter(dest => {
    const matchName = isMatch(name, dest.Destination);
    const matchRegion = isMatch(region, dest.Region);
    const matchCountry = isMatch(country, dest.Country);

    // Debug logging for matches
    if (matchName && matchRegion && matchCountry) {
      console.log(`Match found:`, {
        destination: dest.Destination,
        region: dest.Region,
        country: dest.Country,
        searchTerms: { name, region, country }
      });
    }

    return matchName && matchRegion && matchCountry;
  })
  .slice(0, limit);

  if (matches.length === 0) {
    return res.status(404).json({ 
      error: 'No matching destinations found',
      searchCriteria: { 
        name: name || null, 
        region: region || null, 
        country: country || null,
        limit: limit 
      }
    });
  }

  res.json(matches);
});

// Route to get a destination by ID
router.get("/:id", (req, res) => {
  console.log(`GET request for ${req.url}`)
  const id = parseInt(req.params.id, 10);
  const destinations = getDestinations();

  if (!destinations || destinations.length === 0) {
    return res.status(503).json({ error: 'Destination data is not yet loaded' });
  }

  if (isNaN(id) || id < 1 || id > destinations.length) {
    return res.status(400).json({ error: 'Invalid destination ID' });
  }

  const destination = destinations[id - 1];
  if (destination) {
    res.json(destination);
  } else {
    res.status(404).json({ error: 'Destination not found' });
  }
});

// Route to get coordinates for a given destination ID
router.get("/:id/coordinates", (req, res) => {
  const id = parseInt(req.params.id, 10);
  console.log(`GET request for coordinates of destination ID: ${id}`);
  const destinations = getDestinations();

  // Check if destinations array is loaded
  if (!destinations || destinations.length === 0) {
    return res.status(503).json({ error: 'Destination data is not yet loaded' });
  }

  // Validate ID and find the destination with the matching ID
  if (isNaN(id) || id < 1 || id > destinations.length) {
    console.warn(`Invalid destination ID: ${id}`);
    return res.status(400).json({ error: 'Invalid destination ID' });
  }

  const destination = destinations.find(dest => dest.id === id);

  // Check if destination was found
  if (!destination) {
    console.warn(`Destination not found for ID: ${id}`);
    return res.status(404).json({ error: 'Destination not found' });
  }

  // Safely return latitude and longitude if they exist
  const { Latitude, Longitude } = destination;
  if (!Latitude || !Longitude) {
    console.warn(`Coordinates not available for ID: ${id}`);
    return res.status(404).json({ error: 'Coordinates not available' });
  }

  res.json({ latitude: Latitude, longitude: Longitude });
});

module.exports = router;