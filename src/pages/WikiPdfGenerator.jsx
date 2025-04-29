import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, AlertCircle, FileText, Settings, ExternalLink } from "lucide-react";
import { WikiRequest } from '@/api/entities';
import { User } from '@/api/entities';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import configObj from '../components/config';

export default function WikiPdfGenerator() {
  const [hasPermission, setHasPermission] = useState(false);
  const [pages, setPages] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [wikiSource, setWikiSource] = useState('hamichlol');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [status, setStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // שימוש בהגדרות מקובץ התצורה
  const API_URL = configObj.API_URL;
  const wikiSources = configObj.WIKI_SOURCES;
  const API_KEY = configObj.API_KEY;

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        setHasPermission(user?.can_generate_pdf || false);
      } catch (err) {
        // המשתמש אינו מחובר או אין לו הרשאות
        // במצב אורח, נאפשר גישה מוגבלת
        setHasPermission(true);
        console.log('Guest user or error checking permission');
      }
    };
    checkPermission();
  }, []);

  useEffect(() => {
    let interval;
    if (taskId && status !== 'completed' && status !== 'failed') {
      interval = setInterval(checkStatus, 2000);
    }
    return () => clearInterval(interval);
  }, [taskId, status]);

  // פונקציה להכנת שם קובץ תקין
  const sanitizeFileName = (fileName) => {
    return fileName
      .replace(/\s+/g, '_') // החלפת רווחים בקו תחתון
      .replace(/[^\u0590-\u05FF\w\-_]/g, '') // השארת אותיות עבריות, אנגליות, מספרים וקו תחתון
      .trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Submit] ====== Starting new PDF generation ======');
    setIsLoading(true);
    setError('');
    setTaskId('');
    setDownloadUrl('');
    setStatus('');
    setDebugInfo(null);

    try {
      const pagesList = pages
        .split('\n')
        .map(page => page.trim())
        .filter(page => page.length > 0);

      const requestBody = {
        wiki_pages: pagesList,
        book_title: bookTitle || 'ספר ויקיפדיה',
        base_url: wikiSources[wikiSource]
      };

      console.log('[Submit] Sending request to API:', {
        url: `${API_URL}/api/pdf/generate`,
        requestBody
      });

      // שליחת הבקשה ליצירת PDF עם מפתח API
      const response = await fetch(`${API_URL}/api/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}` // הוספת מפתח API
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[Submit] API Response:', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Submit] API Error:', errorData);
        throw new Error(errorData.detail || `שגיאה ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Submit] API Success Response:', data);
      
      if (!data.task_id) {
        console.error('[Submit] No task_id in response:', data);
        throw new Error('לא התקבל מזהה משימה מהשרת');
      }

      const originalTaskId = data.task_id;
      console.log(`[Submit] Received task_id: ${originalTaskId}`);
      
      // בדיקה מיידית שהמשימה קיימת
      console.log(`[Submit] Verifying task exists at: ${API_URL}/api/pdf/status/${originalTaskId}`);
      const verifyResponse = await fetch(`${API_URL}/api/pdf/status/${originalTaskId}`);
      
      const verifyData = await verifyResponse.json().catch(() => ({}));
      console.log('[Submit] Verify task response:', {
        status: verifyResponse.status,
        data: verifyData
      });

      if (!verifyResponse.ok) {
        console.error('[Submit] Task verification failed:', verifyData);
        throw new Error('המשימה נוצרה אך לא ניתן לאמת את קיומה');
      }

      // שמירה במסד הנתונים
      try {
        // במקום לנסות לשנות את ה-ID, נשמור את המזהה המקורי בשדה נפרד
        const dbRequest = {
          pages: pagesList,
          status: 'pending',
          is_public: isPublic,
          book_title: bookTitle || pagesList[0] || 'wiki',
          original_task_id: originalTaskId // שומר את המזהה המקורי בשדה ייעודי
        };

        console.log('[Submit] Saving to database:', dbRequest);
        
        // יצירת רשומה חדשה (מערכת base44 תקצה מזהה משלה)
        const createdRequest = await WikiRequest.create(dbRequest);
        console.log('[Submit] Created request:', createdRequest);
        
        // שימוש במזהה המקורי בכל מקום אחר בקוד
        setTaskId(originalTaskId);
        setStatus('pending');
        
        // שמירת כל המידע הרלוונטי לדיבאג
        setDebugInfo({
          task_id: originalTaskId,
          request: {
            url: `${API_URL}/api/pdf/generate`,
            body: requestBody
          },
          initial_response: data,
          verify_response: verifyData,
          db_id: createdRequest.id
        });
      } catch (dbErr) {
        console.error('[Submit] Database error:', dbErr);
      }
    } catch (err) {
      console.error('[Submit] Error:', err);
      setError(err.message);
      setDebugInfo({ error: err.message, timestamp: new Date().toISOString() });
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      console.log(`[Status Check] ====== Checking status for task ${taskId} ======`);
      
      const statusUrl = `${API_URL}/api/pdf/status/${taskId}`;
      console.log(`[Status Check] Status URL: ${statusUrl}`);
      
      const response = await fetch(statusUrl);
      console.log(`[Status Check] Status response code: ${response.status}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.error(`[Status Check] Task not found: ${taskId}`);
          setError('המשימה לא נמצאה. ייתכן שפג תוקפה או נמחקה.');
          setStatus('failed');
          
          // עדכון הסטטוס במסד הנתונים - בדיקה לפי original_task_id
          const requests = await WikiRequest.list();
          const matchingRequest = requests.find(req => req.original_task_id === taskId);
          
          if (matchingRequest) {
            await WikiRequest.update(matchingRequest.id, { 
              status: 'failed',
              error: 'Task not found'
            });
          }
          return;
        }
        throw new Error(`שגיאה ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("[Status Check] API Response:", data);

      setStatus(data.status);

      try {
        // חיפוש הבקשה לפי original_task_id
        const requests = await WikiRequest.list();
        const matchingRequest = requests.find(req => req.original_task_id === taskId);
        
        if (matchingRequest) {
          console.log(`[Status Check] Found matching request in DB:`, matchingRequest);
          
          if (matchingRequest.status !== data.status) {
            console.log(`[Status Check] Status changed from ${matchingRequest.status} to ${data.status}`);
            
            if (data.status === 'completed') {
              // בניית ה-URL להורדה עם שם הקובץ
              const fileName = bookTitle || (pages.split('\n')[0].trim()) || 'המכלול';
              const safeFileName = sanitizeFileName(fileName);
              
              // בניית URL להורדה עם שם קובץ
              const downloadUrl = `${API_URL}/api/pdf/download/${taskId}/${safeFileName}.pdf`;
              console.log('[Status Check] Download URL with filename:', downloadUrl);

              setDownloadUrl(downloadUrl);
              await WikiRequest.update(matchingRequest.id, { 
                status: 'completed',
                pdf_url: downloadUrl
              });
            } else if (data.status === 'failed') {
              console.error('[Status Check] Task failed:', data.error);
              setError('אירעה שגיאה ביצירת ה-PDF');
              await WikiRequest.update(matchingRequest.id, { 
                status: 'failed',
                error: data.error || 'Unknown error'
              });
            } else {
              await WikiRequest.update(matchingRequest.id, { status: data.status });
            }
          } else if (data.status === 'completed' && !downloadUrl) {
            // אם אין URL להורדה אבל המשימה הושלמה
            const fileName = bookTitle || (pages.split('\n')[0].trim()) || 'המכלול';
            const safeFileName = sanitizeFileName(fileName);
            
            const downloadUrl = `${API_URL}/api/pdf/download/${taskId}/${safeFileName}.pdf`;
            console.log('[Status Check] Setting download URL with filename:', downloadUrl);
            setDownloadUrl(downloadUrl);
          }
        } else {
          console.error(`[Status Check] No matching request found for task_id ${taskId}`);
        }
      } catch (dbErr) {
        console.error('[Status Check] Database error:', dbErr);
      }
    } catch (err) {
      console.error('[Status Check] General error:', err);
      setError('שגיאה בבדיקת סטטוס המשימה');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {!hasPermission ? (
          <Card className="shadow-lg">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-2xl font-bold">
                אין הרשאה
              </CardTitle>
              <CardDescription>
                אין לך הרשאה ליצור קבצי PDF. אנא פנה למנהל המערכת.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-2xl font-bold">
                ממיר ערכי המכלול ל-PDF
              </CardTitle>
              <CardDescription>
                <a 
                  href={API_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mt-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  {API_URL}
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    כותרת הספר
                  </label>
                  <Input
                    dir="rtl"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="למשל: המדריך להמכלול"
                    className="text-right"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    מקור הערכים
                  </label>
                  <RadioGroup 
                    defaultValue="hamichlol" 
                    value={wikiSource}
                    onValueChange={setWikiSource}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="hamichlol" id="hamichlol" />
                      <Label htmlFor="hamichlol" className="flex items-center gap-2">
                        המכלול
                        <a 
                          href="https://dev.hamichlol.org.il" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 ml-1" />
                          {wikiSources.hamichlol}
                        </a>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="shitufta" id="shitufta" />
                      <Label htmlFor="shitufta" className="flex items-center gap-2">
                        שיתופתא
                        <a 
                          href="https://shitufta.org.il" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 ml-1" />
                          {wikiSources.shitufta}
                        </a>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    רשימת ערכים (שם אחד בכל שורה)
                  </label>
                  <Textarea
                    dir="rtl"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    placeholder="לדוגמה:&#10;תלמוד&#10;משנה&#10;תנ״ך"
                    className="h-48 text-right"
                  />
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    הפוך את ה-PDF לציבורי (נגיש לכל המשתמשים)
                  </label>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {status && status !== 'failed' && (
                  <Alert className="bg-blue-50 text-blue-700 border-blue-200">
                    <AlertDescription>
                      {status === 'pending' && 'מתחיל בעיבוד...'}
                      {status === 'processing' && 'מעבד את הקבצים...'}
                      {status === 'completed' && 'העיבוד הושלם בהצלחה!'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading || status === 'processing'}
                  >
                    {isLoading || status === 'processing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        מעבד...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        צור PDF
                      </>
                    )}
                  </Button>

                  {downloadUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        console.log('[Download] Opening URL:', downloadUrl);
                        window.open(downloadUrl, '_blank');
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      הורד PDF
                    </Button>
                  )}

                  {status === 'completed' && !downloadUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const fileName = bookTitle || (pages.split('\n')[0].trim()) || 'המכלול';
                        const safeFileName = sanitizeFileName(fileName);
                        const fallbackUrl = `${API_URL}/api/pdf/download/${taskId}/${safeFileName}.pdf`;
                        console.log('[Download] Using fallback URL:', fallbackUrl);
                        window.open(fallbackUrl, '_blank');
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      הורד PDF (נתיב חלופי)
                    </Button>
                  )}
                </div>
              </form>

              {debugInfo && (
                <div className="mt-8 p-4 border rounded-md bg-gray-50">
                  <details>
                    <summary className="text-sm font-medium text-gray-600 cursor-pointer">מידע לצורך דיבאג</summary>
                    <pre dir="ltr" className="mt-2 text-xs text-gray-600 overflow-auto max-h-48 font-mono">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}