import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { sendEmailVerification } from 'firebase/auth';

const VerifyEmail = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!email) {
            setError('Email is required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            // Check if user is currently signed in
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setError('Please sign in first to verify your email');
                return;
            }

            // Send verification email
            await sendEmailVerification(currentUser);
            
            setMessage('Verification email sent! Please check your inbox.');
            setEmail('');
        } catch (err) {
            console.error('Error sending verification email:', err);
            setError('Failed to send verification email. Please try again.');
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
                            <h2 className="text-center mb-4">Email Verification</h2>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value.trim())}
                                        placeholder="Enter your email"
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
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Verification Email'
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

export default VerifyEmail;
