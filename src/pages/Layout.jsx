
import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, Settings, List, Files, Shield, Database, UserCog, Server, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import useAuth from '@/components/auth/useAuth';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const { user, loading, logout, isAdmin } = useAuth();
  
  // אם זה דף הבית, לא מציגים את התפריט
  if (currentPageName === "Home") {
    return <>{children}</>;
  }

  const handleLogin = () => {
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* תפריט ראשי */}
              <Link
                to={createPageUrl("WikiPdfGenerator")}
                className={`inline-flex items-center px-4 text-gray-900 ${
                  currentPageName === "WikiPdfGenerator" ? "border-b-2 border-blue-500" : ""
                }`}
              >
                <FileText className="w-5 h-5 ml-2" />
                יצירת PDF
              </Link>
              {user && (
                <Link
                  to={createPageUrl("MyFiles")}
                  className={`inline-flex items-center px-4 text-gray-900 ${
                    currentPageName === "MyFiles" ? "border-b-2 border-blue-500" : ""
                  }`}
                >
                  <Files className="w-5 h-5 ml-2" />
                  הקבצים שלי
                </Link>
              )}

              {/* תפריט מנהל מערכת */}
              {isAdmin && (
                <div className="flex items-center">
                  <div className="h-6 mx-4 border-r border-gray-200"></div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 ml-4">ניהול מערכת:</span>
                    <Link
                      to={createPageUrl("AdminLogs")}
                      className={`inline-flex items-center px-4 text-gray-900 ${
                        currentPageName === "AdminLogs" ? "border-b-2 border-blue-500" : ""
                      }`}
                    >
                      <List className="w-5 h-5 ml-2" />
                      לוגים
                    </Link>
                    <Link
                      to={createPageUrl("Permissions")}
                      className={`inline-flex items-center px-4 text-gray-900 ${
                        currentPageName === "Permissions" ? "border-b-2 border-blue-500" : ""
                      }`}
                    >
                      <UserCog className="w-5 h-5 ml-2" />
                      ניהול משתמשים
                    </Link>
                    <Link
                      to={createPageUrl("AdminTaskIds")}
                      className={`inline-flex items-center px-4 text-gray-900 ${
                        currentPageName === "AdminTaskIds" ? "border-b-2 border-blue-500" : ""
                      }`}
                    >
                      <Database className="w-5 h-5 ml-2" />
                      מזהי משימות
                    </Link>
                    <Link
                      to={createPageUrl("DeploymentGuide")}
                      className={`inline-flex items-center px-4 text-gray-900 ${
                        currentPageName === "DeploymentGuide" ? "border-b-2 border-blue-500" : ""
                      }`}
                    >
                      <Server className="w-5 h-5 ml-2" />
                      מדריך התקנה
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center">
              {user && (
                <Link
                  to={createPageUrl("Settings")}
                  className={`inline-flex items-center px-4 text-gray-900 ${
                    currentPageName === "Settings" ? "border-b-2 border-blue-500" : ""
                  }`}
                >
                  <Settings className="w-5 h-5 ml-2" />
                  הגדרות
                </Link>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    {user ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                        {user.fullName?.charAt(0) || user.email?.charAt(0) || '?'}
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                        <LogIn className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="left">
                  <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user ? (
                    <>
                      <DropdownMenuItem>
                        {user.fullName || 'משתמש'}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {user.email || ''}
                      </DropdownMenuItem>
                      {user.isAdmin && (
                        <DropdownMenuItem>
                          תפקיד: מנהל
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-red-600">
                        <LogOut className="ml-2 h-4 w-4" />
                        התנתק
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={handleLogin}>
                      <LogIn className="ml-2 h-4 w-4" />
                      התחבר
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
