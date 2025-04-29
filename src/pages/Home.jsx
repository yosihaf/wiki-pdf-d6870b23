import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, FileText, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import googleConfig from '../components/auth/googleConfig';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // בדיקה אם יש טוקן במקרה של חזרה מהתחברות
  useEffect(() => {
    // בדיקה אם המשתמש כבר מחובר
    const checkSession = () => {
      const session = localStorage.getItem('user_session');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          // בדיקה שהסשן לא פג תוקף
          if (sessionData.expiry > Date.now()) {
            navigate(createPageUrl("WikiPdfGenerator"));
            return;
          } else {
            // הסשן פג תוקף
            localStorage.removeItem('user_session');
          }
        } catch (err) {
          console.error('Session parsing error:', err);
          localStorage.removeItem('user_session');
        }
      }
      setIsLoading(false);
    };

    // בדיקה אם יש קוד אימות בחזרה מ-Google
    const checkAuthCode = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('code');
      
      if (authCode) {
        // נקה את ה-URL כדי שהקוד לא יישאר בהיסטוריה
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // החלף את הקוד בטוקן גישה
        exchangeCodeForToken(authCode);
      } else {
        checkSession();
      }
    };

    checkAuthCode();
  }, [navigate]);

  // פונקציה להחלפת הקוד בטוקן גישה
  const exchangeCodeForToken = async (code) => {
    setIsLoading(true);
    try {
      // בסביבת הפיתוח המקומית שלך, תצטרך להשתמש בשרת proxy
      // כיוון שלא ניתן לבצע בקשת token ישירות מהדפדפן (בעיות CORS)
      const tokenResponse = await fetch('/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          code,
          redirectUri: googleConfig.redirectUri
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Token exchange failed');
      }
      
      const tokenData = await tokenResponse.json();
      
      // קבלת פרטי המשתמש מ-Google
      const userInfoResponse = await fetch(googleConfig.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userInfoResponse.json();
      
      // שמירת פרטי המשתמש בלוקל סטורג'
      const sessionData = {
        id: userData.id,
        email: userData.email,
        fullName: userData.name,
        picture: userData.picture,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiry: Date.now() + (tokenData.expires_in * 1000),
        isGoogleAuth: true
      };
      
      localStorage.setItem('user_session', JSON.stringify(sessionData));
      
      // העברה לדף הראשי של האפליקציה
      navigate(createPageUrl("WikiPdfGenerator"));
    } catch (err) {
      console.error('Authentication error:', err);
      setError('אירעה שגיאה בתהליך ההתחברות. אנא נסה שנית.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // יצירת URL להתחברות של Google
    const authUrl = new URL(googleConfig.authUrl);
    authUrl.searchParams.append('client_id', googleConfig.clientId);
    authUrl.searchParams.append('redirect_uri', googleConfig.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', googleConfig.scope);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    
    // הובלה לדף התחברות של Google
    window.location.href = authUrl.toString();
  };

  const handleContinueAsGuest = () => {
    navigate(createPageUrl("WikiPdfGenerator"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-4 md:p-8 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold">Wiki PDF Generator</CardTitle>
            <CardDescription>
              המכלול - יצירת ספרי PDF מערכי ויקי
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <p>ברוכים הבאים למערכת יצירת ספרי PDF מערכי ויקי</p>
              <p className="text-sm text-gray-500">
                המערכת מאפשרת ליצור ספרי PDF מרשימת ערכים בהמכלול או בשיתופתא בקלות
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleGoogleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <LogIn className="mr-2 h-4 w-4" />
                התחבר עם Google
              </Button>
              
              <Button 
                onClick={handleContinueAsGuest} 
                variant="outline"
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                המשך כאורח
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}