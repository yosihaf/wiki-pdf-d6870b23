
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User as AppUser } from '@/api/entities';
import { format } from "date-fns";
import { Shield, UserCog } from "lucide-react";
import { useAuth } from '../components/auth/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function Admins() {
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsAdmin(currentUser?.role === 'admin');
        
        if (currentUser?.role === 'admin') {
          const allUsers = await AppUser.list();
          const adminUsers = allUsers.filter(user => user.role === 'admin');
          setUsers(adminUsers);
        }
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, [currentUser]);


  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <div>
                  <CardTitle className="text-2xl font-bold">מנהלי מערכת</CardTitle>
                  <CardDescription>
                    רשימת כל מנהלי המערכת הפעילים
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-500">טוען...</div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      <strong>שים לב:</strong> כדי להוסיף או להסיר מנהלים, יש להשתמש בממשק הניהול של base44:
                    </p>
                    <ol className="list-decimal list-inside mt-2 text-yellow-800">
                      <li>פתח את ה-workspace</li>
                      <li>לחץ על "Users" בתפריט</li>
                      <li>מצא את המשתמש הרצוי</li>
                      <li>שנה את ה-role שלו ל-"admin" או "user"</li>
                    </ol>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>שם מלא</TableHead>
                        <TableHead>דוא"ל</TableHead>
                        <TableHead>תאריך הצטרפות</TableHead>
                        <TableHead>סטטוס</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell dir="ltr" className="font-mono">
                            {format(new Date(user.created_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                              <UserCog className="w-4 h-4 ml-1" />
                              מנהל מערכת
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            לא נמצאו מנהלי מערכת
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
