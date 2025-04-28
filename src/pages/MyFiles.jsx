
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { AlertCircle, Clock, CheckCircle, XCircle, FileText, Download, RefreshCw, Globe, Lock, Trash2 } from "lucide-react";
import { WikiRequest } from '@/api/entities';
import { User } from '@/api/entities';
import { createPageUrl } from "@/utils";
import { useAuth } from '../components/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const API_URL = 'https://pdf.test.hamichlol.org.il';

export default function MyFiles() {
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const checkFileExists = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      console.error('Error checking file:', err);
      return false;
    }
  };

  // פונקציה להכנת שם קובץ תקין
  const sanitizeFileName = (fileName) => {
    return fileName
      .replace(/\s+/g, '_') // החלפת רווחים בקו תחתון
      .replace(/[^\u0590-\u05FF\w\-_]/g, '') // השארת אותיות עבריות, אנגליות, מספרים וקו תחתון
      .trim();
  };

  const loadData = async () => {
    try {
      console.log('[MyFiles] Starting to load requests');
      const data = await WikiRequest.list('-created_date');
      
      const updatedRequests = [];
      
      for (const request of data) {
        if (request.created_by === currentUser?.email || request.is_public) {
          let updatedRequest = { ...request };
          
          if (request.original_task_id && (!request.status || request.status === 'pending' || request.status === 'processing')) {
            try {
              const statusUrl = `${API_URL}/api/pdf/status/${request.original_task_id}`;
              console.log(`[MyFiles] Checking status at: ${statusUrl}`);
              
              const response = await fetch(statusUrl);
              
              if (response.ok) {
                const statusData = await response.json();
                
                if (statusData.status !== request.status) {
                  if (statusData.status === 'completed') {
                    const fileName = sanitizeFileName(request.book_title || 'המכלול');
                    const downloadUrl = `${API_URL}/api/pdf/download/${request.original_task_id}/${fileName}.pdf`;
                    
                    try {
                      const fileCheck = await fetch(downloadUrl, { method: 'HEAD' });
                      if (fileCheck.ok) {
                        await WikiRequest.update(request.id, { 
                          status: 'completed',
                          pdf_url: downloadUrl
                        });
                        updatedRequest = { 
                          ...updatedRequest, 
                          status: 'completed', 
                          pdf_url: downloadUrl
                        };
                      }
                    } catch (checkErr) {
                      console.error(`[MyFiles] Error checking file at ${downloadUrl}:`, checkErr);
                      // נסיון עם נתיב חלופי
                      const fallbackUrl = `${API_URL}/api/pdf/download/${request.original_task_id}/pdf`;
                      await WikiRequest.update(request.id, { 
                        status: 'completed',
                        pdf_url: fallbackUrl
                      });
                      updatedRequest = { 
                        ...updatedRequest, 
                        status: 'completed', 
                        pdf_url: fallbackUrl
                      };
                    }
                  } else {
                    await WikiRequest.update(request.id, { status: statusData.status });
                    updatedRequest = { ...updatedRequest, status: statusData.status };
                  }
                }
              }
            } catch (statusErr) {
              console.error(`[MyFiles] Error checking status: ${statusErr}`);
            }
          }
          
          updatedRequests.push(updatedRequest);
        }
      }
      
      setRequests(updatedRequests);
    } catch (err) {
      console.error('[MyFiles] Error loading files:', err);
    }
  };

  useEffect(() => {
    const loadUserAndData = async () => {
      try {
        // קבלת פרטי המשתמש הנוכחי
        const user = await User.me();
        setCurrentUser(user);
        
        // טעינת הנתונים
        await loadData();
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };
    
    loadUserAndData();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200"
    };

    const currentStatus = status || 'pending';

    return (
      <Badge variant="outline" className={styles[currentStatus] || styles.pending}>
        {getStatusIcon(currentStatus)}
        <span className="mr-1">
          {currentStatus === 'pending' && 'ממתין'}
          {currentStatus === 'processing' && 'מעבד'}
          {currentStatus === 'completed' && 'הושלם'}
          {currentStatus === 'failed' && 'נכשל'}
        </span>
      </Badge>
    );
  };

  const toggleVisibility = async (request) => {
    try {
      await WikiRequest.update(request.id, {
        is_public: !request.is_public
      });
      await loadData(); // רענון הרשימה
    } catch (err) {
      console.error('Error toggling visibility:', err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">הקבצים שלי</CardTitle>
                <CardDescription>
                  צפייה בקבצי PDF שיצרת והגדרות שיתוף
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setRefreshing(true);
                    loadData().finally(() => setRefreshing(false));
                  }}
                  disabled={refreshing}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  רענן
                </Button>
                
                {currentUser && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (window.confirm('האם אתה בטוח שברצונך למחוק את כל הקבצים שלך?')) {
                        try {
                          // מחיקת כל הרשומות של המשתמש הנוכחי
                          const userRequests = requests.filter(req => req.created_by === currentUser.email);
                          
                          for (const request of userRequests) {
                            // מחיקה מהמסד נתונים
                            await WikiRequest.delete(request.id);
                            
                            // ניסיון למחוק גם מהשרת
                            if (request.original_task_id) {
                              try {
                                await fetch(`${API_URL}/api/pdf/delete/${request.original_task_id}`, {
                                  method: 'DELETE'
                                });
                              } catch (err) {
                                console.error('Failed to delete from server:', err);
                              }
                            }
                          }
                          
                          // רענון הרשימה
                          loadData();
                        } catch (err) {
                          console.error('Failed to delete all requests:', err);
                        }
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    מחק הכל
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>תאריך</TableHead>
                      <TableHead>יוצר</TableHead>
                      <TableHead>ערכים</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>הרשאות</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell dir="ltr" className="font-mono">
                          {format(new Date(request.created_date), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {request.created_by === currentUser?.email ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              אני
                            </Badge>
                          ) : request.created_by}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md overflow-hidden">
                            {request.pages?.map((page, index) => (
                              <Badge 
                                key={index} 
                                variant="outline"
                                className="m-1 bg-gray-50"
                              >
                                <FileText className="w-3 h-3 ml-1" />
                                {page}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.created_by === currentUser?.email ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleVisibility(request)}
                              className={`flex items-center gap-1 transition-colors ${
                                request.is_public
                                  ? 'border-green-200 hover:border-red-200 hover:bg-red-50 text-green-700 hover:text-red-700'
                                  : 'border-gray-200 hover:border-green-200 hover:bg-green-50 text-gray-700 hover:text-green-700'
                              }`}
                            >
                              {request.is_public ? (
                                <>
                                  <Globe className="w-4 h-4 mr-1" />
                                  <span>ציבורי</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-4 h-4 mr-1" />
                                  <span>פרטי</span>
                                </>
                              )}
                            </Button>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              <Globe className="w-4 h-4 ml-1" />
                              ציבורי
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {((request.status === 'completed' && request.file_exists !== false) || 
                              request.file_exists) && (
                              <Button 
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 border-blue-200"
                              >
                                <a 
                                  href={request.pdf_url || `https://pdf.test.hamichlol.org.il/api/pdf/download/${request.original_task_id}/pdf`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Download className="w-4 h-4" />
                                  הורד
                                </a>
                              </Button>
                            )}
                        
                            {request.created_by === currentUser?.email && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 text-red-600 hover:text-red-800 border-red-200"
                                onClick={async () => {
                                  try {
                                    // מחיקת הרשומה מהמסד נתונים
                                    await WikiRequest.delete(request.id);
                                    
                                    // אם יש צורך, אפשר גם לנסות למחוק מהשרת
                                    if (request.original_task_id) {
                                      try {
                                        await fetch(`${API_URL}/api/pdf/delete/${request.original_task_id}`, {
                                          method: 'DELETE'
                                        });
                                      } catch (err) {
                                        console.error('Failed to delete from server:', err);
                                      }
                                    }
                                    
                                    // רענון הרשימה
                                    loadData();
                                  } catch (err) {
                                    console.error('Failed to delete request:', err);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                מחק
                              </Button>
                            )}
                            
                            {(request.status === 'completed' && request.file_exists === false) && (
                              <Badge variant="outline" className="bg-red-100 text-red-800">
                                <XCircle className="w-4 h-4 ml-1" />
                                הקובץ לא נמצא
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {requests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          לא נמצאו קבצים
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
