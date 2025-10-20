import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebaseConfig';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
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
    
        try {
            // Sign in with Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
    
            // Reload the user to get the latest email verification status
            await user.reload();
    
            // Get the updated user object
            const updatedUser = auth.currentUser;
    
            // Retrieve the Firebase ID token
            const idToken = await updatedUser.getIdToken(true);
    
            try {
                // Send the ID token to the backend for verification
                const response = await axios.post('/api/users/login', { idToken });
                
                if (!updatedUser.emailVerified) {
                    alert("Email not verified. Please check your email for verification link.");
                    return;
                }
    
                // Show admin alert if user is an admin
                if (response.data.user.isAdmin) {
                    alert("Welcome! You have administrative access.");
                }
                navigate('/home');
            } catch (err) {
                // Handle backend errors
                if (err.response?.status === 403) {
                    alert("Account is deactivated. Contact administrator.");
                    await auth.signOut(); // Sign out the user
                    return;
                }
                throw err; // Re-throw other errors to be caught by outer catch
            }
        } catch (err) {
            console.error("Login error:", err.message);
            setError("Login failed. Please check your credentials.");
        }
    };    

    return (
        <div className="container mt-5">
            <h2 className="text-center">Login</h2>
            <form onSubmit={handleLogin}>
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
                {error && <p className="text-danger">{error}</p>}
                <button type="submit" className="btn btn-primary w-100">Login</button>
            </form>
            <p className="text-center mt-3">
                <a href="/register">Sign Up</a>
                {" | "}
                <a href="/">Back to Home</a>
            </p>
        </div>
    );
};

export default Login;