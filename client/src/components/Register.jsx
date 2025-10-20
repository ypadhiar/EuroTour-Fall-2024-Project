import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from '../firebaseConfig';
import axios from 'axios';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Email is required.");
            return;
        }
        if (!password) {
            setError("Password is required.");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Invalid email address.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);
            await axios.post('/api/users/register', { email, nickname, password });

            setMessage("Registration successful! Please check your email for verification.");
            setError('');
        } catch (err) {
            // Handle specific Firebase errors
            if (err.code === 'auth/email-already-in-use') {
                setError('This email address is already registered. Please use a different email or try logging in.');
            } else {
                setError(err.message);
            }
            setMessage('');
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center">Register</h2>
            <form onSubmit={handleRegister}>
                <div className="mb-3">
                    <label htmlFor="nickname" className="form-label">User Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email address</label>
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="text-danger">{error}</p>}
                {message && <p className="text-success">{message}</p>}
                <button type="submit" className="btn btn-primary w-100">Register</button>
            </form>
            <p className="text-center mt-3">
                <a href="/login">Login</a>
                {" | "}
                <a href="/">Back to Home</a>
            </p>
        </div>
    );
};

export default Register;