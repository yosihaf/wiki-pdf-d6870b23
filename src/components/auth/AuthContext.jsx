import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { AppUser } from '@/api/entities';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // בדיקת שיחה קיימת בטעינת האפליקציה
    const checkSession = async () => {
      const session = localStorage.getItem('user_session');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          const currentTime = new Date().getTime();
          
          if (sessionData && sessionData.expiry > currentTime) {
            // השיחה עדיין בתוקף
            setCurrentUser(sessionData);
            
            try {
              // ניסיון לקבל מידע מעודכן על המשתמש
              const user = await AppUser.get(sessionData.userId);
              if (user) {
                const updatedSession = {
                  ...sessionData,
                  role: user.role, // עדכון פרטים חשובים כמו תפקיד
                  fullName: user.full_name
                };
                setCurrentUser(updatedSession);
                localStorage.setItem('user_session', JSON.stringify(updatedSession));
              }
            } catch (err) {
              console.error('Error fetching updated user info:', err);
            }
          } else {
            // השיחה פגה, מסירים אותה
            localStorage.removeItem('user_session');
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('Error parsing session:', err);
          localStorage.removeItem('user_session');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const login = async (username, password) => {
    // פונקציית התחברות מחוץ לדף הכניסה 
    try {
      // חיפוש המשתמש לפי שם משתמש
      const users = await AppUser.filter({ username });
      
      if (users.length === 0) {
        return { success: false, error: 'שם משתמש או סיסמה שגויים' };
      }

      const user = users[0];
      const passwordHash = simpleHash(password);
      
      if (passwordHash !== user.password_hash) {
        return { success: false, error: 'שם משתמש או סיסמה שגויים' };
      }

      // יצירת שיחה חדשה
      const sessionData = {
        userId: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        email: user.email,
        expiry: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 שעות
      };

      localStorage.setItem('user_session', JSON.stringify(sessionData));
      setCurrentUser(sessionData);
      
      // עדכון זמן הכניסה האחרון
      await AppUser.update(user.id, { 
        last_login: new Date().toISOString() 
      });

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'אירעה שגיאה בהתחברות' };
    }
  };

  // פונקציה פשוטה לגיבוב סיסמה
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  const register = async (userData) => {
    try {
      // בדיקה אם שם המשתמש כבר קיים
      const existingUsers = await AppUser.filter({ username: userData.username });
      if (existingUsers.length > 0) {
        return { success: false, error: 'שם המשתמש כבר קיים במערכת' };
      }

      // בדיקה אם האימייל כבר קיים
      const existingEmails = await AppUser.filter({ email: userData.email });
      if (existingEmails.length > 0) {
        return { success: false, error: 'כתובת האימייל כבר קיימת במערכת' };
      }

      // יצירת משתמש חדש
      const newUser = {
        username: userData.username,
        password_hash: simpleHash(userData.password),
        email: userData.email,
        full_name: userData.fullName || userData.username,
        role: "user", // ברירת מחדל: משתמש רגיל
        can_generate_pdf: true, // ברירת מחדל: יכול ליצור PDF
        api_key: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // יצירת מפתח API אקראי
        last_login: new Date().toISOString(),
        settings: {
          wiki_api_url: "https://pdf.test.hamichlol.org.il",
          wiki_api_key: ""
        }
      };

      const createdUser = await AppUser.create(newUser);
      return { success: true, user: createdUser };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, error: 'אירעה שגיאה בהרשמה' };
    }
  };

  const logout = () => {
    localStorage.removeItem('user_session');
    setCurrentUser(null);
    navigate('/'); // מעביר למסך ראשי במקום לדף כניסה
  };

  const getUser = async () => {
    if (!currentUser) {
      return null;
    }

    try {
      return await AppUser.get(currentUser.userId);
    } catch (err) {
      console.error('Error fetching user:', err);
      return null;
    }
  };

  const updateUser = async (data) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      await AppUser.update(currentUser.userId, data);
      
      // אם עדכנו שדות חשובים, נעדכן גם את השיחה
      if (data.full_name || data.role) {
        const updatedSession = {
          ...currentUser,
          fullName: data.full_name || currentUser.fullName,
          role: data.role || currentUser.role
        };
        setCurrentUser(updatedSession);
        localStorage.setItem('user_session', JSON.stringify(updatedSession));
      }
      
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      login, 
      logout, 
      register, 
      getUser, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// ייצוא ברירת מחדל
export default { AuthProvider, useAuth };