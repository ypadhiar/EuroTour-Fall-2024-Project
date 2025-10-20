import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import axios from 'axios';

const Header = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const idToken = await user.getIdToken(true);
                    const response = await axios.get('/api/users/profile', {
                        headers: { Authorization: `Bearer ${idToken}` }
                    });
                    
                    if (response.data.isDeactivated) {
                        alert('Your account has been deactivated. Please contact an administrator.');
                        await auth.signOut();
                        setCurrentUser(null);
                        navigate('/');
                        return;
                    }
                    
                    setCurrentUser(response.data);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    await auth.signOut();
                    setCurrentUser(null);
                    navigate('/');
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleAuthAction = () => {
        if (currentUser && !currentUser.isDeactivated) {
            navigate('/my-account');
        } else {
            navigate('/login');
        }
    };

    if (loading) {
        return null;
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
                <a className="navbar-brand" href="/">Travel Destinations Explorer</a>
                
                <div className="d-flex gap-3 mx-auto">
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/home')}
                    >
                        Home
                    </button>
                    {currentUser && currentUser.isAdmin && !currentUser.isDeactivated && (
                        <button 
                            className="btn btn-warning"
                            onClick={() => navigate('/admin-interface')}
                        >
                            Admin Dashboard
                        </button>
                    )}
                </div>
                
                <div className="d-flex">
                    {currentUser && !currentUser.isDeactivated ? (
                        <button 
                            className="btn btn-outline-primary"
                            onClick={handleAuthAction}
                        >
                            {currentUser.nickname || currentUser.email}
                        </button>
                    ) : (
                        <div className="btn-group">
                            <button 
                                className="btn btn-primary"
                                onClick={() => navigate('/login')}
                            >
                                Login
                            </button>
                            <button 
                                className="btn btn-outline-primary"
                                onClick={() => navigate('/register')}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Header;
