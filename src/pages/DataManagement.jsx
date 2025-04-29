
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Database, Search, RefreshCw, Edit, Trash2 } from "lucide-react";
import { WikiRequest } from '@/api/entities';
import { User } from '@/api/entities';
import { format } from "date-fns";
import { useAuth } from '../components/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function DataManagement() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setIsAdmin(currentUser?.role === 'admin');
        if (currentUser?.role === 'admin') {
          loadData();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      const records = await WikiRequest.list('-updated_date');
      setData(records);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(record => 
    record.id?.includes(searchTerm) || 
    record.book_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await WikiRequest.delete(id);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting record:', err);
    } finally {
      setLoading(false);
    }
  };

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
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  ניהול נתונים - סימולציית Workspace
                </CardTitle>
                <CardDescription>
                  גישה מהירה למסד הנתונים ללא צורך בכניסה ל-Workspace
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  רענן
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <strong>הערה:</strong> דף זה מאפשר גישה מוגבלת לנתונים דומה ל-Workspace. לגישה מלאה וכלים נוספים, היכנס ל-Workspace של base44.
                </p>
              </div>
              
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute top-2.5 right-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="חיפוש לפי מזהה, כותרת או יוצר..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-3 pr-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>מזהה</TableHead>
                      <TableHead>כותרת</TableHead>
                      <TableHead>תאריך עדכון</TableHead>
                      <TableHead>יוצר</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <RefreshCw className="w-5 h-5 animate-spin ml-2" />
                            טוען...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          לא נמצאו רשומות מתאימות
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-xs">
                            {record.id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {record.book_title || 'ללא כותרת'}
                          </TableCell>
                          <TableCell dir="ltr">
                            {format(new Date(record.updated_date), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {record.created_by}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => setSelectedRecord(record)}
                                  >
                                    <Edit className="w-4 h-4" />
                                    פרטים
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>פרטי רשומה</DialogTitle>
                                  </DialogHeader>
                                  {selectedRecord && (
                                    <div className="space-y-4">
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">מזהה רשומה:</h3>
                                        <Input 
                                          value={selectedRecord.id} 
                                          disabled 
                                          className="font-mono"
                                          dir="ltr" 
                                        />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">כותרת ספר:</h3>
                                        <Input 
                                          value={selectedRecord.book_title || ''} 
                                          disabled 
                                        />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">סטטוס:</h3>
                                        <Input 
                                          value={selectedRecord.status || ''} 
                                          disabled 
                                        />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">נוצר על ידי:</h3>
                                        <Input 
                                          value={selectedRecord.created_by || ''}
                                          disabled
                                          dir="ltr"
                                        />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">כתובת להורדה:</h3>
                                        <Input 
                                          value={selectedRecord.pdf_url || 'לא זמין'}
                                          disabled
                                          dir="ltr"
                                        />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">ערכים:</h3>
                                        <Textarea 
                                          value={(selectedRecord.pages || []).join('\n')}
                                          disabled
                                          className="h-24"
                                        />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">תאריך יצירה:</h3>
                                        <Input 
                                          value={format(new Date(selectedRecord.created_date), "dd/MM/yyyy HH:mm:ss")}
                                          disabled
                                          dir="ltr"
                                        />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">תאריך עדכון:</h3>
                                        <Input 
                                          value={format(new Date(selectedRecord.updated_date), "dd/MM/yyyy HH:mm:ss")}
                                          disabled
                                          dir="ltr"
                                        />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-sm font-medium mb-1">JSON מלא:</h3>
                                        <Textarea 
                                          value={JSON.stringify(selectedRecord, null, 2)}
                                          disabled
                                          className="h-48 font-mono text-xs"
                                          dir="ltr"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 text-red-600 hover:text-red-800"
                                onClick={() => {
                                  setDeleteId(record.id);
                                  setShowDeleteConfirm(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                מחק
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Delete Confirmation Dialog */}
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>אישור מחיקה</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-center mb-4">האם אתה בטוח שברצונך למחוק רשומה זו?</p>
                    <p className="text-center text-red-600 mb-6">פעולה זו אינה ניתנת לביטול!</p>
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        ביטול
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(deleteId)}
                      >
                        מחק
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
