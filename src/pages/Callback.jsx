import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function Callback() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // טיפול בחזרה מהאימות של גוגל
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          console.error('Auth error:', error);
          setError('אירעה שגיאה בתהליך האימות');
          return;
        }

        if (!code) {
          console.error('Missing authorization code');
          setError('קוד אימות חסר');
          return;
        }

        // העברה לדף הבית שיטפל בקוד האימות
        navigate(createPageUrl("Home") + `?code=${code}`);
      } catch (err) {
        console.error('Callback error:', err);
        setError('אירעה שגיאה בתהליך האימות');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p>מעבד את תהליך ההתחברות...</p>
        </div>
      )}
    </div>
  );
}