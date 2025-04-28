
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from '@/api/entities';
import { format } from "date-fns";
import { Shield, CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '../components/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function Permissions() {
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsAdmin(currentUser?.role === 'admin');
        
        if (currentUser?.role === 'admin') {
          const allUsers = await User.list();
          setUsers(allUsers);
          
          // טעינת רשימת המיילים המורשים מהגדרות המשתמש
          if (currentUser?.allowed_emails) {
            setAllowedEmails(currentUser.allowed_emails.join('\n'));
          }
        }
      } catch (err) {
        console.error('Error loading users:', err);
      }
    };
    loadData();
  }, [currentUser]);

  const saveAllowedEmails = async () => {
    try {
      setIsSaving(true);
      const emails = allowedEmails
        .split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const currentUser = await User.me();
      await User.updateMyUserData({ allowed_emails: emails });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving allowed emails:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = async (userId, currentPermission) => {
    try {
      await User.update(userId, {
        can_generate_pdf: !currentPermission
      });
      // רענון רשימת המשתמשים
      const updatedUsers = await User.list();
      setUsers(updatedUsers);
    } catch (err) {
      console.error('Error updating permission:', err);
    }
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">משתמשים קיימים</TabsTrigger>
              <TabsTrigger value="allowed">מיילים מורשים</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="shadow-lg">
                <CardHeader className="border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Shield className="w-6 h-6" />
                      ניהול הרשאות משתמשים
                    </CardTitle>
                    <CardDescription>
                      ניהול הרשאות ליצירת קבצי PDF
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const allUsers = await User.list();
                          setUsers(allUsers);
                        } catch (err) {
                          console.error('Error fetching users:', err);
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      רענן
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (window.confirm('האם אתה בטוח שברצונך לאפס את כל הרשאות PDF? כל המשתמשים יאבדו גישה.')) {
                          try {
                            for (const user of users) {
                              if (user.can_generate_pdf) {
                                await User.update(user.id, {
                                  can_generate_pdf: false
                                });
                              }
                            }
                            
                            // רענון הרשימה
                            const updatedUsers = await User.list();
                            setUsers(updatedUsers);
                            
                            alert('כל ההרשאות אופסו בהצלחה');
                          } catch (err) {
                            console.error('Error resetting permissions:', err);
                            alert('אירעה שגיאה באיפוס ההרשאות');
                          }
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      אפס הרשאות
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>שם משתמש</TableHead>
                          <TableHead>דוא"ל</TableHead>
                          <TableHead>תפקיד</TableHead>
                          <TableHead>תאריך הצטרפות</TableHead>
                          <TableHead>הרשאת PDF</TableHead>
                          <TableHead>פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.full_name}</TableCell>
                            <TableCell dir="ltr">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}>
                                {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                              </Badge>
                            </TableCell>
                            <TableCell dir="ltr" className="font-mono">
                              {format(new Date(user.created_date), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={user.can_generate_pdf ? 
                                  "bg-green-100 text-green-800" : 
                                  "bg-red-100 text-red-800"}
                              >
                                {user.can_generate_pdf ? (
                                  <CheckCircle className="w-4 h-4 ml-1" />
                                ) : (
                                  <XCircle className="w-4 h-4 ml-1" />
                                )}
                                {user.can_generate_pdf ? 'מורשה' : 'חסום'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => togglePermission(user.id, user.can_generate_pdf)}
                                className={user.can_generate_pdf ? 
                                  "text-red-600 hover:text-red-800" : 
                                  "text-green-600 hover:text-green-800"}
                              >
                                {user.can_generate_pdf ? 'חסום גישה' : 'אפשר גישה'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allowed">
              <Card className="shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Mail className="w-6 h-6" />
                    הגדרת מיילים מורשים
                  </CardTitle>
                  <CardDescription>
                    רק משתמשים עם כתובות המייל הבאות יוכלו להירשם למערכת.
                    רשום כל כתובת מייל בשורה נפרדת.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Textarea
                    dir="ltr"
                    value={allowedEmails}
                    onChange={(e) => setAllowedEmails(e.target.value)}
                    placeholder="user1@example.com&#10;user2@example.com"
                    className="min-h-[200px] font-mono"
                  />
                  
                  {saveSuccess && (
                    <Alert className="bg-green-50 text-green-700 border-green-200">
                      <AlertDescription>הרשימה נשמרה בהצלחה</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={saveAllowedEmails}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? 'שומר...' : 'שמור רשימה'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
