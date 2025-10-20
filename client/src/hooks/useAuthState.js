import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';

export const useAuthState = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // Get the ID token to check admin status
                const idToken = await firebaseUser.getIdToken(true);
                
                try {
                    // Make a request to your backend to get user data including isAdmin
                    const response = await fetch('/api/users/profile', {
                        headers: {
                            'Authorization': `Bearer ${idToken}`
                        }
                    });
                    
                    if (response.ok) {
                        const userData = await response.json();
                        setUser({
                            ...firebaseUser,
                            isAdmin: userData.isAdmin
                        });
                    } else {
                        setUser(firebaseUser);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, loading };
};
