import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings as SettingsIcon, Save, AlertCircle, ExternalLink } from "lucide-react";
import { User } from '@/api/entities';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await User.me();
        if (user) {
          setApiUrl(user.settings?.wiki_api_url || 'https://pdf.test.hamichlol.org.il');
          setApiKey(user.settings?.wiki_api_key || '');
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      await User.updateMyUserData({ 
        settings: {
          wiki_api_url: apiUrl,
          wiki_api_key: apiKey
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('אירעה שגיאה בשמירת ההגדרות');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="w-6 h-6" />
              הגדרות
            </CardTitle>
            <CardDescription>
              הגדרות מתקדמות למערכת
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center justify-between">
                  <span>כתובת ה-API</span>
                  <a 
                    href="https://pdf.test.hamichlol.org.il" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 ml-1" />
                    ברירת מחדל
                  </a>
                </label>
                <Input
                  dir="ltr"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://pdf.test.hamichlol.org.il"
                  className="text-left"
                />
                <p className="text-xs text-gray-500 mt-1">
                  הכתובת הבסיסית של שירות יצירת ה-PDF
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <span>מפתח API</span>
                </label>
                <Input
                  type="password"
                  dir="ltr"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="המפתח שלך לגישה ל-API"
                  className="text-left"
                />
                <p className="text-xs text-gray-500 mt-1">
                  מפתח API לאימות מול שירות יצירת ה-PDF
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert className="bg-green-50 text-green-700 border-green-200">
                  <AlertDescription>ההגדרות נשמרו בהצלחה</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'שומר...' : 'שמור הגדרות'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}