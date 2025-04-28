
// קובץ תצורה למערכת
const config = {
  API_URL: 'https://pdf.test.hamichlol.org.il',  // שנה לכתובת השרת שלך
  WIKI_SOURCES: {
    hamichlol: 'https://dev.hamichlol.org.il/w/rest.php/v1/page',
    shitufta: 'https://shitufta.org.il/w/rest.php/v1/page'
  },
  API_KEY: '923234004266-tip9kmpm5crrtqqhafc7lnvipborv72k.apps.googleusercontent.com' // כאן יש להזין את מפתח ה-API שלך
};

// ייצוא ברירת המחדל של אובייקט התצורה
export default config;

// ייצוא שמי לתאימות עם קוד קיים
export { config };
