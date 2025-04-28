
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertCircle, Clock, CheckCircle, XCircle, FileText, Download, RefreshCw, Trash2 } from "lucide-react";
import { WikiRequest } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { User } from '@/api/entities';
import { useAuth } from '../components/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function AdminLogs() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const checkFileExists = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      console.error('Error checking file:', err);
      return false;
    }
  };

  const loadRequests = async () => {
    try {
      const data = await WikiRequest.list('-created_date');
      
      const updatedRequests = [];
      
      // עדכון סטטוס ובדיקת קיום הקבצים
      for (const request of data) {
        let updatedRequest = { ...request };
        
        // בדיקת סטטוס אם המשימה ממתינה
        if (request.id && (!request.status || request.status === 'pending' || request.status === 'processing')) {
          try {
            const response = await fetch(`https://pdf.test.hamichlol.org.il/api/pdf/status/${request.id}`);
            if (response.ok) {
              const statusData = await response.json();
              
              if (statusData.status !== request.status) {
                if (statusData.status === 'completed') {
                  const fileName = request.book_title || 'wiki';
                  const safeFileName = fileName.replace(/\s+/g, '_')
                                       .replace(/[^\u0590-\u05FF\w\-_]/g, '');
                  const pdfUrl = `https://pdf.test.hamichlol.org.il/api/pdf/download/${request.id}/${encodeURIComponent(safeFileName)}.pdf`;
                  
                  try {
                    await WikiRequest.update(request.id, { 
                      status: statusData.status,
                      pdf_url: pdfUrl
                    });
                    updatedRequest = { ...updatedRequest, status: statusData.status, pdf_url: pdfUrl };
                  } catch (updateErr) {
                    console.error('Update error:', updateErr);
                  }
                } else {
                  try {
                    await WikiRequest.update(request.id, { status: statusData.status });
                    updatedRequest = { ...updatedRequest, status: statusData.status };
                  } catch (updateErr) {
                    console.error('Update error:', updateErr);
                  }
                }
              }
            }
          } catch (statusErr) {
            console.error(`Error checking status for ${request.id}:`, statusErr);
          }
        }
        
        // בדיקה אם הקובץ קיים בשרת
        if (request.status === 'completed' || updatedRequest.status === 'completed') {
          const pdfUrl = updatedRequest.pdf_url || request.pdf_url || 
                         `https://pdf.test.hamichlol.org.il/api/pdf/download/${request.id}/pdf`;
          
          const exists = await checkFileExists(pdfUrl);
          updatedRequest.file_exists = exists;
          
          if (!exists && updatedRequest.status === 'completed') {
            // נסיון לייצר כתובת חלופית
            const alternativeUrl = `https://pdf.test.hamichlol.org.il/api/pdf/download/${request.id}/pdf`;
            const alternativeExists = await checkFileExists(alternativeUrl);
            
            if (alternativeExists) {
              updatedRequest.file_exists = true;
              updatedRequest.pdf_url = alternativeUrl;
              // עדכון במסד הנתונים
              try {
                await WikiRequest.update(request.id, { pdf_url: alternativeUrl });
              } catch (updateErr) {
                console.error('Update URL error:', updateErr);
              }
            }
          }
        }
        
        updatedRequests.push(updatedRequest);
      }
      
      setRequests(updatedRequests);
    } catch (err) {
      console.error('Error loading files:', err);
    }
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
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200"
    };

    return (
      <Badge variant="outline" className={styles[status]}>
        {getStatusIcon(status)}
        <span className="mr-1">
          {status === 'pending' && 'ממתין'}
          {status === 'processing' && 'מעבד'}
          {status === 'completed' && 'הושלם'}
          {status === 'failed' && 'נכשל'}
        </span>
      </Badge>
    );
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">לוג בקשות PDF</CardTitle>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadRequests}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  רענן
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל קבצי ה-PDF? פעולה זו אינה ניתנת לביטול!')) {
                      try {
                        // מחיקת כל הבקשות
                        for (const request of requests) {
                          // נסיון למחוק מהשרת קודם
                          if (request.original_task_id) {
                            try {
                              await fetch(`https://pdf.test.hamichlol.org.il/api/pdf/delete/${request.original_task_id}`, {
                                method: 'DELETE'
                              });
                              console.log(`Deleted task from server: ${request.original_task_id}`);
                            } catch (err) {
                              console.error(`Error deleting from server: ${request.original_task_id}`, err);
                            }
                          }
                          
                          // מחיקה מהמסד נתונים
                          await WikiRequest.delete(request.id);
                          console.log(`Deleted request from DB: ${request.id}`);
                        }
                        
                        alert('כל הבקשות נמחקו בהצלחה');
                        loadRequests(); // רענון הרשימה
                      } catch (err) {
                        console.error('Error deleting requests:', err);
                        alert('אירעה שגיאה במחיקת הבקשות');
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>תאריך</TableHead>
                      <TableHead>משתמש</TableHead>
                      <TableHead>הרשאה</TableHead>
                      <TableHead>ערכים</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>ציבורי</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell dir="ltr" className="font-mono">
                          {format(new Date(request.created_date), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{request.created_by}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const users = await User.list();
                                const user = users.find(u => u.email === request.created_by);
                                if (user) {
                                  await User.update(user.id, {
                                    can_generate_pdf: !user.can_generate_pdf
                                  });
                                  // רענון הדף
                                  window.location.reload();
                                }
                              } catch (err) {
                                console.error('Error updating user permission:', err);
                              }
                            }}
                          >
                            <Badge 
                              variant="outline" 
                              className={request.created_by_data?.can_generate_pdf ? 
                                "bg-green-100 text-green-800" : 
                                "bg-red-100 text-red-800"}
                            >
                              {request.created_by_data?.can_generate_pdf ? 'מורשה' : 'חסום'}
                            </Badge>
                          </Button>
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
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          {request.is_public ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              ציבורי
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800">
                              פרטי
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {((request.status === 'completed' && request.file_exists !== false) || 
                            request.file_exists) && (
                            <a 
                              href={request.pdf_url || `https://pdf.test.hamichlol.org.il/api/pdf/download/${request.id}/pdf`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          
                          {(request.status === 'completed' && request.file_exists === false) && (
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              לא נמצא
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {requests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          לא נמצאו בקשות
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
