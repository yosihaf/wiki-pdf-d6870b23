
// הגדרות OAuth של Google
const googleConfig = {
  clientId: '923234004266-tip9kmpm5crrtqqhafc7lnvipborv72k.apps.googleusercontent.com', // יש להחליף ב-Client ID שלך מ-Google Cloud Console
  redirectUri: `${window.location.origin}/auth/callback`,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo',
  scope: 'email profile',
};

export default googleConfig;
