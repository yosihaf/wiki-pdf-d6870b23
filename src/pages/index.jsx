import Layout from "./Layout.jsx";

import WikiPdfGenerator from "./WikiPdfGenerator";

import Settings from "./Settings";

import AdminLogs from "./AdminLogs";

import MyFiles from "./MyFiles";

import Permissions from "./Permissions";

import AdminTaskIds from "./AdminTaskIds";

import Admins from "./Admins";

import DataManagement from "./DataManagement";

import DeploymentGuide from "./DeploymentGuide";

import Home from "./Home";

import Callback from "./Callback";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    WikiPdfGenerator: WikiPdfGenerator,
    
    Settings: Settings,
    
    AdminLogs: AdminLogs,
    
    MyFiles: MyFiles,
    
    Permissions: Permissions,
    
    AdminTaskIds: AdminTaskIds,
    
    Admins: Admins,
    
    DataManagement: DataManagement,
    
    DeploymentGuide: DeploymentGuide,
    
    Home: Home,
    
    Callback: Callback,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<WikiPdfGenerator />} />
                
                
                <Route path="/WikiPdfGenerator" element={<WikiPdfGenerator />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/AdminLogs" element={<AdminLogs />} />
                
                <Route path="/MyFiles" element={<MyFiles />} />
                
                <Route path="/Permissions" element={<Permissions />} />
                
                <Route path="/AdminTaskIds" element={<AdminTaskIds />} />
                
                <Route path="/Admins" element={<Admins />} />
                
                <Route path="/DataManagement" element={<DataManagement />} />
                
                <Route path="/DeploymentGuide" element={<DeploymentGuide />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Callback" element={<Callback />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}