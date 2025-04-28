import { useState, useEffect, useCallback } from 'react';
import googleConfig from './googleConfig';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // טעינת המשתמש מ-localStorage בעת טעינת האפליקציה
  useEffect(() => {
    const loadUserFromSession = () => {
      const session = localStorage.getItem('user_session');
      if (session) {
        try {
          const userData = JSON.parse(session);
          
          // בדיקה אם הטוקן פג תוקף
          if (userData.expiry > Date.now()) {
            setUser(userData);
          } else {
            // הטוקן פג תוקף, נמחק אותו
            localStorage.removeItem('user_session');
            setUser(null);
          }
        } catch (e) {
          console.error('Error parsing user session:', e);
          localStorage.removeItem('user_session');
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    loadUserFromSession();
  }, []);
  
  // התנתקות - מחיקת הסשן
  const logout = useCallback(() => {
    localStorage.removeItem('user_session');
    setUser(null);
    // אפשר גם להוביל לדף הבית
    window.location.href = '/';
  }, []);
  
  // רענון טוקן כשהוא פג תוקף
  const refreshToken = useCallback(async () => {
    const session = localStorage.getItem('user_session');
    if (!session) return null;
    
    try {
      const userData = JSON.parse(session);
      
      if (!userData.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: userData.refreshToken
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const tokenData = await response.json();
      
      // עדכון הסשן עם הטוקן החדש
      const updatedSession = {
        ...userData,
        accessToken: tokenData.access_token,
        expiry: Date.now() + (tokenData.expires_in * 1000),
      };
      
      localStorage.setItem('user_session', JSON.stringify(updatedSession));
      setUser(updatedSession);
      
      return updatedSession;
    } catch (e) {
      console.error('Error refreshing token:', e);
      localStorage.removeItem('user_session');
      setUser(null);
      return null;
    }
  }, []);
  
  // בדיקה אם המשתמש מנהל
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: isAdmin(),
    logout,
    refreshToken
  };
}

export default useAuth;