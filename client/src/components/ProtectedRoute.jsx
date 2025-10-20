import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { useAuthState } from '../hooks/useAuthState';

const ProtectedRoute = ({ element, requireAdmin = false }) => {
    const { user, loading } = useAuthState();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requireAdmin && !user.isAdmin) {
        return <Navigate to="/home" />;
    }

    return element;
};

export default ProtectedRoute;
