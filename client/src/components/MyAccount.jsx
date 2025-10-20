import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';

const MyAccount = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setAuthChecked(true);
            if (!user) {
                navigate('/');
                return;
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (err) {
            console.error('Error signing out:', err);
            setError('Failed to sign out');
        }
    };

    if (!authChecked || loading) {
        return <div className="container mt-4">Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-body">
                    <h2 className="card-title mb-4">My Account</h2>
                    
                    {error && <div className="alert alert-danger">{error}</div>}
                    
                    <div className="d-flex gap-3">
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/update-password')}
                        >
                            Update Password
                        </button>
                        <button 
                            className="btn btn-danger"
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;
