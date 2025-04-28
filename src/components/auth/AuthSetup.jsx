/**
 * # Google OAuth הגדרת
 *
 * על מנת להגדיר את מערכת האימות של Google, יש לבצע את הצעדים הבאים:
 *
 * ## 1. יצירת פרויקט ב-Google Cloud Console
 *
 * 1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com/)
 * 2. צור פרויקט חדש או בחר פרויקט קיים
 * 3. מתפריט הצד, בחר ב-**"APIs & Services" > "Dashboard"**
 * 4. לחץ על **"+ ENABLE APIS AND SERVICES"**
 * 5. חפש את **"Google Identity"** והפעל את ה-API
 *
 * ## 2. הגדרת OAuth Consent Screen
 *
 * 1. בחר **"OAuth consent screen"** מהתפריט בצד
 * 2. בחר ב-**User Type** (פנימי או חיצוני) בהתאם לצרכים שלך
 * 3. מלא את הפרטים הנדרשים:
 *    - שם האפליקציה
 *    - דוא"ל תמיכה
 *    - לוגו (אופציונלי)
 *    - תחומים מורשים (הדומיין של האפליקציה שלך)
 *
 * ## 3. יצירת OAuth Client ID
 *
 * 1. בחר **"Credentials"** מהתפריט בצד
 * 2. לחץ על **"+ CREATE CREDENTIALS"** ובחר **"OAuth client ID"**
 * 3. בחר בסוג האפליקציה: **"Web application"**
 * 4. תן שם לקליינט
 * 5. הוסף את ה-URI המורשים:
 *    - הוסף את ה-URL של האפליקציה (לדוגמה: https://example.com)
 * 6. הוסף URI להפניית redirect:
 *    - הוסף את כתובת ה-callback (לדוגמה: https://example.com/auth/callback)
 *
 * ## 4. קבלת מזהים והגדרת האפליקציה
 *
 * 1. לאחר היצירה, תקבל:
 *    - **Client ID**
 *    - **Client Secret**
 * 2. העתק את ערכים אלו לקובץ `components/auth/googleConfig.js`:
 *    ```javascript
 *    export const googleConfig = {
 *      clientId: 'YOUR_CLIENT_ID_HERE',
 *      clientSecret: 'YOUR_CLIENT_SECRET_HERE',
 *      // ...
 *    };
 *    ```
 *
 * ## 5. הגדרת שרת להחלפת קוד בטוקן
 *
 * כדי להימנע מבעיות CORS, תצטרך לממש נקודות קצה בשרת שיטפלו בבקשות אימות:
 *
 * 1. `/api/auth/token` - נקודת קצה להחלפת קוד אימות בטוקן גישה
 * 2. `/api/auth/refresh` - נקודת קצה לחידוש טוקן פג תוקף
 *
 * הקוד לנקודות קצה אלו נמצא בקובץ `components/server/authAPI.js`.
 *
 * ## 6. הפעלת האפליקציה עם OAuth
 *
 * 1. וודא שכל הפרמטרים מוגדרים נכון
 * 2. הפעל את האפליקציה והתחבר באמצעות כפתור "התחבר עם Google"
 * 3. המשתמש יופנה לדף ההתחברות של Google, ולאחר אישור יחזור לאפליקציה שלך עם קוד אימות
 */

// קובץ זה הוא רק למטרת תיעוד, אין בו קוד פעיל
export default function AuthSetup() {
  return null;
}