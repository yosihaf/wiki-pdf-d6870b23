// זה יהיה קוד השרת (אתה תצטרך להתאים אותו לסביבת השרת שלך)

// קבלת טוקן ממשק ה-Google OAuth
export async function handleTokenExchange(req, res) {
  try {
    const { code, redirectUri } = req.body;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokenData = await tokenResponse.json();
    res.json(tokenData);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// רענון טוקן
export async function handleTokenRefresh(req, res) {
  try {
    const { refresh_token } = req.body;

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    });

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json();
      console.error('Token refresh error:', errorData);
      return res.status(400).json({ error: 'Token refresh failed' });
    }

    const tokenData = await refreshResponse.json();
    res.json(tokenData);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}