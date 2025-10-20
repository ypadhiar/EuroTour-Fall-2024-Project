import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebaseConfig';

const AdminInterface = () => {
    const [view, setView] = useState('users'); // 'users' or 'reviews'
    const [users, setUsers] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch data on component mount
    useEffect(() => {
        fetchData();
    }, [view]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            if (view === 'users') {
                const response = await axios.get('/api/admin/users', {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                const filteredUsers = response.data.filter(user => 
                    user.email !== auth.currentUser.email
                );
                setUsers(filteredUsers);
            } else {
                const response = await axios.get('/api/admin/reviews', {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                setReviews(response.data);
            }
        } catch (err) {
            setError('Failed to fetch data. Please try again.');
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (email, currentStatus) => {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            await axios.put(`/api/admin/users/${email}/status`, 
                { isDeactivated: !currentStatus },
                { headers: { Authorization: `Bearer ${idToken}` }}
            );
            fetchData();
        } catch (err) {
            setError('Failed to update user status.');
            console.error('Update error:', err);
        }
    };

    const toggleAdminStatus = async (email, currentStatus) => {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            await axios.put(`/api/admin/users/${email}/admin`, 
                { isAdmin: !currentStatus },
                { headers: { Authorization: `Bearer ${idToken}` }}
            );
            fetchData();
        } catch (err) {
            setError('Failed to update admin status.');
            console.error('Update error:', err);
        }
    };

    const toggleReviewVisibility = async (listName, reviewId, currentVisibility) => {
        try {
            const idToken = await auth.currentUser.getIdToken(true);
            await axios.put(`/api/admin/reviews/${listName}/${reviewId}/visibility`, 
                { isVisible: !currentVisibility },
                { headers: { Authorization: `Bearer ${idToken}` }}
            );
            fetchData();
        } catch (err) {
            setError('Failed to update review visibility.');
            console.error('Update error:', err);
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Admin Dashboard</h2>
                <div className="btn-group">
                    <button 
                        className={`btn ${view === 'users' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setView('users')}
                    >
                        Users
                    </button>
                    <button 
                        className={`btn ${view === 'reviews' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setView('reviews')}
                    >
                        Reviews
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : view === 'users' ? (
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Nickname</th>
                                <th>Admin Status</th>
                                <th>Account Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.email}>
                                    <td>{user.email}</td>
                                    <td>{user.nickname}</td>
                                    <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                                    <td>{user.isDeactivated ? 'Deactivated' : 'Active'}</td>
                                    <td>
                                        <button
                                            className={`btn btn-sm ${user.isDeactivated ? 'btn-success' : 'btn-danger'} me-2`}
                                            onClick={() => toggleUserStatus(user.email, user.isDeactivated)}
                                        >
                                            {user.isDeactivated ? 'Activate' : 'Deactivate'}
                                        </button>
                                        <button
                                            className={`btn btn-sm ${user.isAdmin ? 'btn-warning' : 'btn-info'}`}
                                            onClick={() => toggleAdminStatus(user.email, user.isAdmin)}
                                        >
                                            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>List Name</th>
                                <th>User</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Visibility</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(review => (
                                <tr key={`${review.listName}-${review.id}`}>
                                    <td>{review.listName}</td>
                                    <td>{review.userName}</td>
                                    <td>{review.rating}</td>
                                    <td>{review.comment}</td>
                                    <td>{review.isVisible ? 'Visible' : 'Hidden'}</td>
                                    <td>
                                        <button
                                            className={`btn btn-sm ${review.isVisible ? 'btn-warning' : 'btn-success'}`}
                                            onClick={() => toggleReviewVisibility(review.listName, review.id, review.isVisible)}
                                        >
                                            {review.isVisible ? 'Hide' : 'Show'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminInterface;
