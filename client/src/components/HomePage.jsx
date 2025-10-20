import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Map from './Map';
import { auth } from '../firebaseConfig';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const HomePage = () => {
    const [searchTerms, setSearchTerms] = useState({
        name: '',
        region: '',
        country: ''
    });
    const [results, setResults] = useState([]);
    const [expandedResult, setExpandedResult] = useState(null);
    const [resultsPerPage, setResultsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default to London
    const [mapZoom, setMapZoom] = useState(4);
    const [mapKey, setMapKey] = useState(0); // Add key for forcing re-render

    // New states for list features
    const [activeTab, setActiveTab] = useState('public'); // 'public' or 'my-lists'
    const [publicLists, setPublicLists] = useState([]);
    const [myLists, setMyLists] = useState([]);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');
    const [isNewListPublic, setIsNewListPublic] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Add these new states after the existing state declarations
    const [expandedList, setExpandedList] = useState(null);
    const [expandedDestinations, setExpandedDestinations] = useState({});
    const [listDestinations, setListDestinations] = useState({});

    // Add this new state for storing destination details
    const [destinationDetails, setDestinationDetails] = useState({});

    // Add these new states after your existing state declarations
    const [newReview, setNewReview] = useState({
        rating: 5,
        comment: ''
    });
    const [isAddingReview, setIsAddingReview] = useState(false);

    // Add this to your state declarations (around line 35-40)
    const [selectedList, setSelectedList] = useState('');

    // Add these new states after your existing state declarations
    const [editingList, setEditingList] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        isVisible: false,
    });

    // Add this new state for tracking which list is being deleted
    const [deletingList, setDeletingList] = useState(null);

    // Add this helper function at the top of your component
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Fetch public lists
    const fetchPublicLists = async () => {
        try {
            const response = await axios.get('/api/lists');
            const lists = response.data;
            // Filter public lists, sort by creation date, and limit to 10
            const publicOnlyLists = lists
                .filter(list => list.isVisible)
                .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
                .slice(0, 10);  // Ensure only 10 lists are returned
            setPublicLists(publicOnlyLists);
        } catch (err) {
            console.error('Error fetching public lists:', err);
        }
    };

    // Add this function after fetchPublicLists
    const fetchMyLists = async () => {
        try {
            if (!auth.currentUser) {
                console.log('No authenticated user found');
                return;
            }

            console.log('Current user:', auth.currentUser.email);
            
            const idToken = await auth.currentUser.getIdToken(true);
            console.log('Got ID token, fetching lists...');
            
            const response = await axios.get('/api/lists', {
                headers: { Authorization: `Bearer ${idToken}` }
            });
            
            console.log('Raw response data:', response.data);
            
            const lists = response.data;
            const userEmail = auth.currentUser.email;
            
            // Filter lists by creatorEmail or creatorNickname
            const userLists = lists.filter(list => {
                console.log('Checking list:', {
                    listCreatorEmail: list.creatorEmail,
                    listCreatorNickname: list.creatorNickname,
                    userEmail: userEmail,
                    matches: list.creatorEmail === userEmail || list.creatorNickname === userEmail
                });
                return list.creatorEmail === userEmail || list.creatorNickname === userEmail;
            });
            
            console.log('Filtered user lists:', userLists);
            
            const sortedLists = userLists.sort((a, b) => 
                new Date(b.creationDate) - new Date(a.creationDate)
            );
            
            console.log('Final sorted lists:', sortedLists);
            setMyLists(sortedLists);
            
        } catch (err) {
            console.error('Error fetching my lists:', err);
            if (err.response) {
                console.error('Response data:', err.response.data);
                console.error('Response status:', err.response.status);
            }
        }
    };

    // Add this useEffect to log state changes
    useEffect(() => {
        console.log('myLists state updated:', myLists);
    }, [myLists]);

    // Create new list
    const handleCreateList = async (e) => {
        e.preventDefault();
        try {
            // Check if user has reached the maximum limit of 20 lists
            if (myLists.length >= 20) {
                alert('You have reached the maximum limit of 20 lists. Please delete some lists to create new ones.');
                return;
            }

            const idToken = await auth.currentUser.getIdToken(true);
            
            // Make the request with the token in header
            const response = await axios.post('/api/lists', 
                {
                    name: newListName,
                    description: newListDescription,
                    isVisible: isNewListPublic
                },
                {
                    headers: { Authorization: `Bearer ${idToken}` }
                }
            );

            // Reset form
            setNewListName('');
            setNewListDescription('');
            setIsNewListPublic(false);
            setShowCreateForm(false);
            
            // Refresh both public and private lists
            if (activeTab === 'public') {
                fetchPublicLists();
            } else {
                fetchMyLists();
            }
        } catch (err) {
            console.error('Error creating list:', err);
            alert(err.response?.data?.error || 'Failed to create list');
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('/api/destinations/search', {
                params: {
                    ...searchTerms,
                    n: resultsPerPage
                }
            });
            setResults(response.data);
            
            // Center map on first result if available
            if (response.data.length > 0) {
                const firstResult = response.data[0];
                setMapCenter([parseFloat(firstResult.Latitude), parseFloat(firstResult.Longitude)]);
                setMapZoom(6);
                setMapKey(prev => prev + 1); // Force map re-render
            }
        } catch (err) {
            setError('Failed to fetch results. Please try again.');
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDDGSearch = (destination) => {
        const searchQuery = `${destination.Destination}, ${destination.Country}`;
        const encodedQuery = encodeURIComponent(searchQuery);
        window.open(`https://duckduckgo.com/?q=${encodedQuery}`, '_blank');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchTerms(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleResultsPerPageChange = (e) => {
        setResultsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    // Update the fetchListDetails function
    const fetchListDetails = async (listName) => {
        try {
            // Get destination IDs from list
            const listResponse = await axios.get(`/api/lists/${encodeURIComponent(listName)}`);
            const destinationIds = listResponse.data.destinations || [];
            
            // Get reviews
            const reviewsResponse = await axios.get(`/api/lists/${encodeURIComponent(listName)}/reviews`);
            
            // Fetch details for each destination ID
            const destinationPromises = destinationIds.map(async (destId) => {
                try {
                    const destResponse = await axios.get(`/api/destinations/${destId}`);
                    return {
                        id: destId,
                        ...destResponse.data
                    };
                } catch (err) {
                    console.error(`Error fetching destination ${destId}:`, err);
                    return null;
                }
            });

            const destinations = (await Promise.all(destinationPromises)).filter(Boolean);

            setListDestinations(prev => ({
                ...prev,
                [listName]: {
                    destinations,
                    reviews: reviewsResponse.data
                }
            }));

        } catch (err) {
            console.error('Error fetching list details:', err);
            // Handle race conditions
            if (err.response?.status === 404) {
                setPublicLists(prev => prev.filter(list => list.name !== listName));
                setExpandedList(null);
            }
        }
    };

    // Add this function to handle destination expansion
    const handleDestinationExpand = (listName, destId) => {
        setExpandedDestinations(prev => ({
            ...prev,
            [listName]: {
                ...prev[listName],
                [destId]: !prev[listName]?.[destId]
            }
        }));
    };

    // Add cleanup effect
    useEffect(() => {
        fetchPublicLists();
        // Cleanup map
        return () => {
            const container = L.DomUtil.get('map');
            if (container != null) {
                container._leaflet_id = null;
            }
        };
    }, []);

    // Add this useEffect to log state changes
    useEffect(() => {
        console.log('List destinations state:', listDestinations);
    }, [listDestinations]);

    const handleCollapseAll = () => {
        setExpandedList(null);
        setExpandedDestinations({});
    };

    // Add this function to handle review submission
    const handleReviewSubmit = async (listName) => {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            await axios.post(
                `/api/lists/${encodeURIComponent(listName)}/reviews`,
                {
                    rating: parseInt(newReview.rating),
                    comment: newReview.comment
                },
                {
                    headers: { Authorization: `Bearer ${idToken}` }
                }
            );
            
            // Reset form and fetch updated reviews
            setNewReview({ rating: 5, comment: '' });
            setIsAddingReview(false);
            fetchListDetails(listName);
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Failed to submit review. Please try again.');
        }
    };

    // Modify the useEffect to include fetchMyLists when tab changes
    useEffect(() => {
        if (activeTab === 'public') {
            fetchPublicLists();
        } else if (activeTab === 'my-lists' && auth.currentUser) {
            fetchMyLists();
        }
    }, [activeTab, auth.currentUser]);

    // Add this function after handleSearch
    const handleAddToList = async (destinationId) => {
        try {
            if (!selectedList) {
                alert('Please select a list first');
                return;
            }

            const idToken = await auth.currentUser.getIdToken(true);
            await axios.put(
                `/api/lists/${encodeURIComponent(selectedList)}/destinations`,
                { destinationId },
                {
                    headers: { Authorization: `Bearer ${idToken}` }
                }
            );

            alert('Destination added to list successfully!');
            // Refresh the lists to show updated destination count
            fetchMyLists();
        } catch (err) {
            console.error('Error adding destination to list:', err);
            alert(err.response?.data?.error || 'Failed to add destination to list');
        }
    };

    // Add these new functions after your existing handler functions
    const handleEditClick = (list) => {
        setEditingList(list.name);
        setEditForm({
            name: list.name,
            description: list.description || '',
            isVisible: list.isVisible,
        });
    };

    const handleEditSubmit = async (originalName) => {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            await axios.put(
                `/api/lists/${encodeURIComponent(originalName)}/update`,
                editForm,
                {
                    headers: { Authorization: `Bearer ${idToken}` }
                }
            );
            
            setEditingList(null);
            fetchMyLists();
        } catch (err) {
            console.error('Error updating list:', err);
            alert(err.response?.data?.error || 'Failed to update list');
        }
    };

    const handleRemoveDestination = async (listName, destinationId) => {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            await axios.delete(
                `/api/lists/${encodeURIComponent(listName)}/destinations/${encodeURIComponent(destinationId)}`,
                {
                    headers: { Authorization: `Bearer ${idToken}` }
                }
            );
            
            // Refresh the list details and my lists
            await fetchListDetails(listName);
            await fetchMyLists();
        } catch (err) {
            console.error('Error removing destination:', err);
            alert(err.response?.data?.error || 'Failed to remove destination');
        }
    };

    const handleDeleteList = async (listName) => {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            await axios.delete(
                `/api/lists/${encodeURIComponent(listName)}`,
                {
                    headers: { Authorization: `Bearer ${idToken}` }
                }
            );
            setDeletingList(null);
            fetchMyLists();
        } catch (err) {
            console.error('Error deleting list:', err);
            alert(err.response?.data?.error || 'Failed to delete list');
        }
    };

    const handleTabChange = (tab) => {
        if (tab === 'my-lists' && !auth.currentUser) {
            alert('Please log in to access your lists');
            return;
        }
        setActiveTab(tab);
    };

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                {/* Left side - Search and Map */}
                <div className="col-md-6">
                    <h2 className="mb-4">Search Destinations</h2>
                    
                    {/* Map component */}
                    <div id="map" style={{ height: '400px' }} className="mb-4">
                        <Map 
                            key={`map-${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
                            center={mapCenter}
                            zoom={mapZoom}
                            markers={results}
                        />
                    </div>

                    {/* List Selection Dropdown */}
                    {auth.currentUser && myLists.length > 0 && (
                        <div className="mb-4">
                            <select 
                                className="form-select"
                                value={selectedList}
                                onChange={(e) => setSelectedList(e.target.value)}
                            >
                                <option value="">Select a list to add destinations</option>
                                {myLists.map(list => (
                                    <option key={list.name} value={list.name}>
                                        {list.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Search Form */}
                    <div className="mb-4">
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Destination Name"
                            name="name"
                            value={searchTerms.name}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Region"
                            name="region"
                            value={searchTerms.region}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            className="form-control mb-2"
                            placeholder="Country"
                            name="country"
                            value={searchTerms.country}
                            onChange={handleInputChange}
                        />
                        <div className="mb-2">
                            <label className="form-label">Results per page:</label>
                            <select 
                                className="form-select"
                                value={resultsPerPage}
                                onChange={handleResultsPerPageChange}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                        <button 
                            className="btn btn-primary w-100"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {/* Search Results */}
                    <div className="search-results">
                        {results.map(destination => (
                            <div key={destination.id} className="card mb-3">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title">
                                            {destination.Destination}, {destination.Country}
                                        </h5>
                                        {auth.currentUser && (
                                            <button
                                                className="btn btn-sm btn-success"
                                                onClick={() => handleAddToList(destination.id)}
                                                disabled={!selectedList}
                                            >
                                                Add to List
                                            </button>
                                        )}
                                    </div>
                                    {expandedResult === destination.id ? (
                                        <div className="mt-2">
                                            <p><strong>Region:</strong> {destination.Region}</p>
                                            <p><strong>Country:</strong> {destination.Country}</p>
                                            <p><strong>Category:</strong> {destination.Category}</p>
                                            <p><strong>Approximate Annual Tourists:</strong> {destination["Approximate Annual Tourists"]}</p>
                                            <p><strong>Currency:</strong> {destination.Currency}</p>
                                            <p><strong>Majority Religion:</strong> {destination["Majority Religion"]}</p>
                                            <p><strong>Famous Foods:</strong> {destination["Famous Foods"]}</p>
                                            <p><strong>Language:</strong> {destination.Language}</p>
                                            <p><strong>Best Time to Visit:</strong> {destination["Best Time to Visit"]}</p>
                                            <p><strong>Cost of Living:</strong> {destination["Cost of Living"]}</p>
                                            <p><strong>Safety:</strong> {destination.Safety}</p>
                                            <p><strong>Cultural Significance:</strong> {destination["Cultural Significance"]}</p>
                                            {destination.Description && <p><strong>Description:</strong> {destination.Description}</p>}
                                            <div className="mt-2">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => handleDDGSearch(destination)}
                                                >
                                                    Search on DuckDuckGo
                                                </button>
                                            </div>
                                            <button
                                                className="btn btn-sm btn-outline-primary mt-2"
                                                onClick={() => setExpandedResult(null)}
                                            >
                                                Show Less
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-sm btn-outline-primary mt-2"
                                            onClick={() => setExpandedResult(destination.id)}
                                        >
                                            Show More
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side - Lists */}
                <div className="col-md-6">
                    <div className="d-flex justify-content-between mb-4">
                        <button 
                            className={`btn ${activeTab === 'public' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handleTabChange('public')}
                        >
                            Public Lists
                        </button>
                        <button 
                            className={`btn ${activeTab === 'my-lists' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => handleTabChange('my-lists')}
                        >
                            My Lists
                        </button>
                    </div>

                    {activeTab === 'public' && (
                        <div className="public-lists">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3>Recent Public Lists</h3>
                                <button 
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={handleCollapseAll}
                                >
                                    Collapse All
                                </button>
                            </div>
                            {publicLists.map(list => (
                                <div key={list.name} className="card mb-3">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h5 className="card-title mb-0">{list.name}</h5>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => {
                                                    if (expandedList === list.name) {
                                                        setExpandedList(null);
                                                        setExpandedDestinations({});
                                                    } else {
                                                        setExpandedList(list.name);
                                                        fetchListDetails(list.name);
                                                    }
                                                }}
                                            >
                                                {expandedList === list.name ? 'Show Less' : 'Show More'}
                                            </button>
                                        </div>
                                        <div className="mt-2">
                                            <small className="text-muted d-block">Created by: {list.creatorNickname}</small>
                                            <small className="text-muted d-block">Last Modified: {formatDateTime(list.creationDate)}</small>
                                            <small className="text-muted d-block">Destinations: {list.destinations?.length || 0}</small>
                                            <small className="text-muted d-block">Rating: {list.averageRating?.toFixed(1)} ⭐</small>
                                        </div>
                                        
                                        {expandedList === list.name && (
                                            <div className="mt-3">
                                                <p className="card-text">{list.description}</p>
                                                <h6>Destinations:</h6>
                                                <div className="list-group">
                                                    {listDestinations[list.name]?.destinations?.map(dest => (
                                                        <div key={dest.id} className="list-group-item">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <h6 className="mb-1">{dest.Destination}, {dest.Country}</h6>
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary"
                                                                    onClick={() => handleDestinationExpand(list.name, dest.id)}
                                                                >
                                                                    {expandedDestinations[list.name]?.[dest.id] ? 'Show Less' : 'Show More'}
                                                                </button>
                                                            </div>
                                                            {expandedDestinations[list.name]?.[dest.id] && (
                                                                <div className="mt-2">
                                                                    <p><strong>Region:</strong> {dest.Region}</p>
                                                                    <p><strong>Country:</strong> {dest.Country}</p>
                                                                    <p><strong>Category:</strong> {dest.Category}</p>
                                                                    <p><strong>Approximate Annual Tourists:</strong> {dest["Approximate Annual Tourists"]}</p>
                                                                    <p><strong>Currency:</strong> {dest.Currency}</p>
                                                                    <p><strong>Majority Religion:</strong> {dest["Majority Religion"]}</p>
                                                                    <p><strong>Famous Foods:</strong> {dest["Famous Foods"]}</p>
                                                                    <p><strong>Language:</strong> {dest.Language}</p>
                                                                    <p><strong>Best Time to Visit:</strong> {dest["Best Time to Visit"]}</p>
                                                                    <p><strong>Cost of Living:</strong> {dest["Cost of Living"]}</p>
                                                                    <p><strong>Safety:</strong> {dest.Safety}</p>
                                                                    <p><strong>Cultural Significance:</strong> {dest["Cultural Significance"]}</p>
                                                                    {dest.Description && <p><strong>Description:</strong> {dest.Description}</p>}
                                                                    <div className="mt-2">
                                                                        <button
                                                                            className="btn btn-sm btn-outline-secondary"
                                                                            onClick={() => handleDDGSearch(dest)}
                                                                        >
                                                                            Search on DuckDuckGo
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {/* Reviews Section */}
                                                <h6 className="mt-4">Reviews:</h6>
                                                <div className="list-group mb-3">
                                                    {listDestinations[list.name]?.reviews?.filter(review => review.isVisible !== false).map((review, index) => (
                                                        <div key={index} className="list-group-item">
                                                            <div className="d-flex justify-content-between">
                                                                <span>Rating: {'⭐'.repeat(Math.round(review.rating))}</span>
                                                                <small className="text-muted">
                                                                    {new Date(review.createdDate).toLocaleDateString()}
                                                                </small>
                                                            </div>
                                                            <p className="mb-0 mt-1">{review.comment}</p>
                                                            <small className="text-muted">By: {review.userName}</small>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add Review Button and Form */}
                                                {auth.currentUser ? (
                                                    isAddingReview ? (
                                                        <div className="card mb-3">
                                                            <div className="card-body">
                                                                <h6>Add Review</h6>
                                                                <div className="mb-3">
                                                                    <label className="form-label">Rating</label>
                                                                    <select 
                                                                        className="form-select"
                                                                        value={newReview.rating}
                                                                        onChange={(e) => setNewReview(prev => ({
                                                                            ...prev,
                                                                            rating: e.target.value
                                                                        }))}
                                                                    >
                                                                        {[5,4,3,2,1].map(num => (
                                                                            <option key={num} value={num}>
                                                                                {num} {'⭐'.repeat(num)}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="mb-3">
                                                                    <label className="form-label">Comment</label>
                                                                    <textarea
                                                                        className="form-control"
                                                                        rows="3"
                                                                        value={newReview.comment}
                                                                        onChange={(e) => setNewReview(prev => ({
                                                                            ...prev,
                                                                            comment: e.target.value
                                                                        }))}
                                                                    ></textarea>
                                                                </div>
                                                                <div className="d-flex gap-2">
                                                                    <button 
                                                                        className="btn btn-primary"
                                                                        onClick={() => handleReviewSubmit(list.name)}
                                                                    >
                                                                        Save Review
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-secondary"
                                                                        onClick={() => {
                                                                            setIsAddingReview(false);
                                                                            setNewReview({ rating: 5, comment: '' });
                                                                        }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            className="btn btn-outline-primary mb-3"
                                                            onClick={() => setIsAddingReview(true)}
                                                        >
                                                            Add Review
                                                        </button>
                                                    )
                                                ) : (
                                                    <p className="text-muted mb-3">Sign in to add a review</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'my-lists' && (
                        <div className="my-lists">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3>My Lists</h3>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowCreateForm(prev => !prev)}
                                >
                                    Create New List
                                </button>
                            </div>

                            {/* Create List Form */}
                            {showCreateForm && (
                                <div className="card mb-4">
                                    <div className="card-body">
                                        <form onSubmit={handleCreateList}>
                                            <div className="mb-3">
                                                <label className="form-label">List Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={newListName}
                                                    onChange={(e) => setNewListName(e.target.value)}
                                                    maxLength={50}
                                                    required
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Description</label>
                                                <textarea
                                                    className="form-control"
                                                    value={newListDescription}
                                                    onChange={(e) => setNewListDescription(e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="mb-3 form-check">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="isPublic"
                                                    checked={isNewListPublic}
                                                    onChange={(e) => setIsNewListPublic(e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="isPublic">
                                                    Make this list public
                                                </label>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button type="submit" className="btn btn-primary">
                                                    Create List
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setShowCreateForm(false);
                                                        setNewListName('');
                                                        setNewListDescription('');
                                                        setIsNewListPublic(false);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Display user's lists */}
                            <div className="list-group">
                                {myLists.length > 0 ? (
                                    myLists.map(list => (
                                        <div key={list.name} className="card mb-3">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    {editingList === list.name ? (
                                                        <form 
                                                            className="w-100"
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                handleEditSubmit(list.name);
                                                            }}
                                                        >
                                                            <div className="mb-2">
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    value={editForm.name}
                                                                    onChange={(e) => setEditForm(prev => ({
                                                                        ...prev,
                                                                        name: e.target.value
                                                                    }))}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="mb-2">
                                                                <textarea
                                                                    className="form-control"
                                                                    value={editForm.description}
                                                                    onChange={(e) => setEditForm(prev => ({
                                                                        ...prev,
                                                                        description: e.target.value
                                                                    }))}
                                                                    rows="2"
                                                                />
                                                            </div>
                                                            <div className="mb-2 form-check">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    id={`visibility-${list.name}`}
                                                                    checked={editForm.isVisible}
                                                                    onChange={(e) => setEditForm(prev => ({
                                                                        ...prev,
                                                                        isVisible: e.target.checked
                                                                    }))}
                                                                />
                                                                <label className="form-check-label" htmlFor={`visibility-${list.name}`}>
                                                                    Make list public
                                                                </label>
                                                            </div>
                                                            <div className="d-flex gap-2">
                                                                <button type="submit" className="btn btn-sm btn-primary">
                                                                    Save
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-sm btn-secondary"
                                                                    onClick={() => setEditingList(null)}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                <h5 className="mb-0">{list.name}</h5>
                                                                {list.description && (
                                                                    <p className="mt-2 mb-1">{list.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="d-flex gap-2 align-items-start">
                                                                <span className={`badge ${list.isVisible ? 'bg-success' : 'bg-secondary'}`}>
                                                                    {list.isVisible ? 'Public' : 'Private'}
                                                                </span>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => setDeletingList(list.name)}
                                                                >
                                                                    Delete
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary"
                                                                    onClick={() => handleEditClick(list)}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => {
                                                                        if (expandedList === list.name) {
                                                                            setExpandedList(null);
                                                                            setExpandedDestinations({});
                                                                        } else {
                                                                            setExpandedList(list.name);
                                                                            fetchListDetails(list.name);
                                                                        }
                                                                    }}
                                                                >
                                                                    {expandedList === list.name ? 'Show Less' : 'Show More'}
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <small className="text-muted">
                                                    Last Modified: {formatDateTime(list.creationDate)}
                                                </small>
                                                <div className="mt-2">
                                                    <small className="text-muted">
                                                        Destinations: {list.destinations?.length || 0}
                                                    </small>
                                                </div>

                                                {/* Add destinations display when expanded */}
                                                {expandedList === list.name && (
                                                    <div className="mt-3">
                                                        <h6>Destinations:</h6>
                                                        <div className="list-group">
                                                            {listDestinations[list.name]?.destinations?.map(dest => (
                                                                <div key={dest.id} className="list-group-item">
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <h6 className="mb-1">{dest.Destination}, {dest.Country}</h6>
                                                                        <div className="d-flex gap-2">
                                                                            <button
                                                                                className="btn btn-sm btn-outline-danger"
                                                                                onClick={() => handleRemoveDestination(list.name, dest.id)}
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-secondary"
                                                                                onClick={() => handleDestinationExpand(list.name, dest.id)}
                                                                            >
                                                                                {expandedDestinations[list.name]?.[dest.id] ? 'Show Less' : 'Show More'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    {expandedDestinations[list.name]?.[dest.id] && (
                                                                        <div className="mt-2">
                                                                            <p><strong>Region:</strong> {dest.Region}</p>
                                                                            <p><strong>Country:</strong> {dest.Country}</p>
                                                                            <p><strong>Category:</strong> {dest.Category}</p>
                                                                            <p><strong>Approximate Annual Tourists:</strong> {dest["Approximate Annual Tourists"]}</p>
                                                                            <p><strong>Currency:</strong> {dest.Currency}</p>
                                                                            <p><strong>Majority Religion:</strong> {dest["Majority Religion"]}</p>
                                                                            <p><strong>Famous Foods:</strong> {dest["Famous Foods"]}</p>
                                                                            <p><strong>Language:</strong> {dest.Language}</p>
                                                                            <p><strong>Best Time to Visit:</strong> {dest["Best Time to Visit"]}</p>
                                                                            <p><strong>Cost of Living:</strong> {dest["Cost of Living"]}</p>
                                                                            <p><strong>Safety:</strong> {dest.Safety}</p>
                                                                            <p><strong>Cultural Significance:</strong> {dest["Cultural Significance"]}</p>
                                                                            {dest.Description && <p><strong>Description:</strong> {dest.Description}</p>}
                                                                            <div className="mt-2">
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-secondary"
                                                                                    onClick={() => handleDDGSearch(dest)}
                                                                                >
                                                                                    Search on DuckDuckGo
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-muted mt-3">
                                        You haven't created any lists yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingList && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setDeletingList(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete the list "{deletingList}"? This action cannot be undone.
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setDeletingList(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger" 
                                    onClick={() => {
                                        handleDeleteList(deletingList);
                                        setDeletingList(null);
                                    }}
                                >
                                    Delete List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
