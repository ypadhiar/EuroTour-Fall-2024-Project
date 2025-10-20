import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    updatePassword 
} from 'firebase/auth';
import axios from 'axios';

const UpdatePassword = () => {
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            // Input validation
            if (!email || !validateEmail(email)) {
                setError('Please enter a valid email address');
                return;
            }

            if (!currentPassword) {
                setError('Current password is required');
                return;
            }

            if (!validatePassword(newPassword)) {
                setError('New password must be at least 6 characters long');
                return;
            }

            if (newPassword !== confirmPassword) {
                setError('New passwords do not match');
                return;
            }

            // Check if user is logged in
            const user = auth.currentUser;
            if (!user) {
                setError('Please log in first');
                return;
            }

            // Create credentials for reauthentication
            const credential = EmailAuthProvider.credential(
                email,
                currentPassword
            );

            // Reauthenticate user
            await reauthenticateWithCredential(user, credential);

            // Update password in Firebase
            await updatePassword(user, newPassword);

            // Update password in backend
            const idToken = await user.getIdToken();
            await axios.put('/api/users/update-password', {
                email,
                currentPassword,
                newPassword
            }, {
                headers: {
                    Authorization: `Bearer ${idToken}`
                }
            });

            setMessage('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Error updating password:', err);
            if (err.code === 'auth/requires-recent-login') {
                setError('Please log in again before updating your password');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect current password. Please try again.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to update password. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-center mb-4">Update Password</h2>
                            
                            <form onSubmit={handleUpdatePassword}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">Email address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value.trim())}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="currentPassword" className="form-label">Current Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                {message && (
                                    <div className="alert alert-success" role="alert">
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-3">
                                <a href="/login" className="text-decoration-none">
                                    Back to Login
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdatePassword;
