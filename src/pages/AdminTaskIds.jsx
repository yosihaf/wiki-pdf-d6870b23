
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { WikiRequest } from '@/api/entities';
import { User } from '@/api/entities';
import { Copy, RefreshCw, Download, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '../components/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function AdminTaskIds() {
  const [requests, setRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setIsAdmin(currentUser?.role === 'admin');
        if (currentUser?.role === 'admin') {
          loadRequests();
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [currentUser]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await WikiRequest.list('-created_date');
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const testApiStatus = async (taskId) => {
    try {
      const API_URL = 'https://pdf.test.hamichlol.org.il';
      console.log(`Testing API status for ${taskId}`);
      const response = await fetch(`${API_URL}/api/pdf/status/${taskId}`);
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { error: 'Invalid JSON response' };
      }
      
      return {
        statusCode: response.status,
        ok: response.ok,
        data: responseData
      };
    } catch (err) {
      console.error('Error testing API:', err);
      return {
        error: err.message,
        ok: false
      };
    }
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id)
      .then(() => {
        setCopied({...copied, [id]: true});
        setTimeout(() => setCopied({...copied, [id]: false}), 2000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  const filteredRequests = requests.filter(request => 
    request.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-2xl font-bold">
                גישה מוגבלת
              </CardTitle>
              <CardDescription>
                רק מנהלי מערכת יכולים לצפות בדף זה
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">מזהי משימות (Task IDs)</CardTitle>
                <CardDescription>
                  רשימת כל מזהי המשימות במערכת
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadRequests}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  רענן
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל מזהי המשימות? פעולה זו אינה ניתנת לביטול!')) {
                      try {
                        setLoading(true);
                        // מחיקת כל המשימות מהשרת
                        const API_URL = 'https://pdf.test.hamichlol.org.il';
                        for (const request of requests) {
                          const taskId = request.original_task_id || request.id;
                          try {
                            await fetch(`${API_URL}/api/pdf/delete/${taskId}`, {
                              method: 'DELETE'
                            });
                            console.log(`Deleted task from server: ${taskId}`);
                            
                            // מחיקה מהמסד נתונים
                            await WikiRequest.delete(request.id);
                            console.log(`Deleted request from DB: ${request.id}`);
                          } catch (err) {
                            console.error(`Error deleting task: ${taskId}`, err);
                          }
                        }
                        
                        alert('כל המשימות נמחקו בהצלחה');
                        loadRequests(); // רענון הרשימה
                      } catch (err) {
                        console.error('Error deleting tasks:', err);
                        alert('אירעה שגיאה במחיקת המשימות');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  מחק הכל
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <Input
                  placeholder="חיפוש לפי מזהה, כותרת או משתמש..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">מזהה משימה (Task ID)</TableHead>
                      <TableHead>מזהה מקורי</TableHead>
                      <TableHead>תאריך</TableHead>
                      <TableHead>כותרת</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>משתמש</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell dir="ltr" className="font-mono text-xs break-all">
                          {request.id}
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono text-xs break-all text-green-600">
                          {request.original_task_id || <span className="text-gray-400">לא זמין</span>}
                        </TableCell>
                        <TableCell dir="ltr" className="font-mono whitespace-nowrap">
                          {format(new Date(request.created_date), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={request.book_title}>
                          {request.book_title || <span className="text-gray-400">ללא כותרת</span>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              request.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : request.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {request.status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={request.created_by}>
                          {request.created_by}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTask(request)}
                                  className="flex items-center gap-1"
                                >
                                  פרטים מלאים
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold">
                                    פרטי משימה: {selectedTask?.book_title || 'משימה'}
                                  </DialogTitle>
                                </DialogHeader>
                                {selectedTask && (
                                  <Tabs defaultValue="details">
                                    <TabsList className="grid w-full grid-cols-3">
                                      <TabsTrigger value="details">פרטי משימה</TabsTrigger>
                                      <TabsTrigger value="json">JSON מלא</TabsTrigger>
                                      <TabsTrigger value="api">בדיקת API</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="details">
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <h3 className="font-medium">מזהה משימה:</h3>
                                            <div dir="ltr" className="bg-gray-50 p-2 rounded-md font-mono text-xs break-all">
                                              {selectedTask.id}
                                            </div>
                                          </div>
                                          <div>
                                              <h3 className="font-medium">מזהה מקורי:</h3>
                                              <div dir="ltr" className="bg-gray-50 p-2 rounded-md font-mono text-xs break-all text-green-600">
                                                {selectedTask.original_task_id || <span className="text-gray-400">לא זמין</span>}
                                              </div>
                                            </div>
                                          <div>
                                            <h3 className="font-medium">סטטוס:</h3>
                                            <Badge
                                              variant="outline"
                                              className={
                                                selectedTask.status === 'completed'
                                                  ? 'bg-green-100 text-green-800'
                                                  : selectedTask.status === 'failed'
                                                  ? 'bg-red-100 text-red-800'
                                                  : selectedTask.status === 'processing'
                                                  ? 'bg-blue-100 text-blue-800'
                                                  : 'bg-yellow-100 text-yellow-800'
                                              }
                                            >
                                              {selectedTask.status || 'pending'}
                                            </Badge>
                                          </div>
                                          <div>
                                            <h3 className="font-medium">תאריך יצירה:</h3>
                                            <p dir="ltr" className="font-mono">
                                              {format(new Date(selectedTask.created_date), "dd/MM/yyyy HH:mm:ss")}
                                            </p>
                                          </div>
                                          <div>
                                            <h3 className="font-medium">נוצר על ידי:</h3>
                                            <p>{selectedTask.created_by}</p>
                                          </div>
                                          <div>
                                            <h3 className="font-medium">כותרת ספר:</h3>
                                            <p>{selectedTask.book_title || <span className="text-gray-400">לא הוגדר</span>}</p>
                                          </div>
                                          <div>
                                            <h3 className="font-medium">הרשאות:</h3>
                                            <Badge variant="outline" className={selectedTask.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>
                                              {selectedTask.is_public ? 'ציבורי' : 'פרטי'}
                                            </Badge>
                                          </div>
                                          <div>
                                            <h3 className="font-medium">קישור ל-PDF:</h3>
                                            {selectedTask.pdf_url ? (
                                              <a 
                                                href={selectedTask.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline break-all"
                                                dir="ltr"
                                              >
                                                {selectedTask.pdf_url}
                                              </a>
                                            ) : (
                                              <span className="text-gray-400">לא זמין</span>
                                            )}
                                          </div>
                                          {selectedTask.error && (
                                            <div className="col-span-2">
                                              <h3 className="font-medium">שגיאה:</h3>
                                              <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{selectedTask.error}</AlertDescription>
                                              </Alert>
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <h3 className="font-medium">רשימת ערכים:</h3>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedTask.pages?.map((page, index) => (
                                              <Badge key={index} variant="outline" className="bg-gray-50">
                                                {page}
                                              </Badge>
                                            ))}
                                            {(!selectedTask.pages || selectedTask.pages.length === 0) && (
                                              <span className="text-gray-400">לא הוגדרו ערכים</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="json">
                                      <div className="bg-gray-50 p-4 rounded-md">
                                        <h3 className="font-medium mb-2">JSON מלא של המשימה:</h3>
                                        <pre dir="ltr" className="text-xs overflow-auto max-h-96 font-mono">
                                          {JSON.stringify(selectedTask, null, 2)}
                                        </pre>
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="api">
                                      <div className="space-y-4">
                                        <div>
                                          <h3 className="font-medium mb-2">בדיקת API מול השרת:</h3>
                                          <Button
                                            onClick={async () => {
                                              const apiTest = await testApiStatus(selectedTask.id);
                                              setSelectedTask({
                                                ...selectedTask,
                                                apiTest
                                              });
                                            }}
                                          >
                                            בדוק סטטוס API
                                          </Button>
                                        </div>
                                        
                                        {selectedTask.apiTest && (
                                          <div>
                                            <h3 className="font-medium mb-2">תוצאות בדיקת API:</h3>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                              <div className="mb-2">
                                                <strong>קוד סטטוס:</strong> {selectedTask.apiTest.statusCode || 'שגיאה'}
                                              </div>
                                              <div className="mb-2">
                                                <strong>תקין:</strong> {selectedTask.apiTest.ok ? '✅ כן' : '❌ לא'}
                                              </div>
                                              <div>
                                                <strong>תשובת השרת:</strong>
                                                <pre dir="ltr" className="text-xs overflow-auto max-h-48 font-mono mt-2">
                                                  {JSON.stringify(selectedTask.apiTest.data || selectedTask.apiTest.error, null, 2)}
                                                </pre>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        <div>
                                          <h3 className="font-medium mb-2">קישור ישיר ל-API:</h3>
                                          <p dir="ltr" className="text-xs font-mono mb-2">
                                            https://pdf.test.hamichlol.org.il/api/pdf/status/{selectedTask.id}
                                          </p>
                                          <Button
                                            variant="outline"
                                            asChild
                                            size="sm"
                                          >
                                            <a 
                                              href={`https://pdf.test.hamichlol.org.il/api/pdf/status/${selectedTask.id}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              פתח בחלון חדש
                                            </a>
                                          </Button>
                                        </div>
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(request.original_task_id || request.id)}
                              className="flex items-center gap-1"
                            >
                              <Copy className="w-4 h-4" />
                              {copied[request.id] ? 'הועתק!' : 'העתק'}
                            </Button>
                            
                            {request.status === 'completed' && request.pdf_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex items-center gap-1 text-blue-600"
                              >
                                <a 
                                  href={request.pdf_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          {loading ? 'טוען...' : 'לא נמצאו רשומות'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">פרטים על TASK_ID</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="mb-2">
                    <strong>מבנה:</strong> מזהה בן 24 תווים הקסדצימליים
                  </p>
                  <p className="mb-2">
                    <strong>מקור:</strong> נוצר על ידי השרת בעת יצירת משימה חדשה
                  </p>
                  <p>
                    <strong>שימוש:</strong> משמש לבדיקת סטטוס והורדת הקובץ בהמשך
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
