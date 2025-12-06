import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PresentationPage } from './pages/presentation.tsx'
import { AdminPage } from './pages/admin.tsx'
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Page 1: Presentation Mode (Demo) - Full screen camera view */}
        <Route path="/" element={<PresentationPage />} />
        <Route path="/presentation" element={<PresentationPage />} />
        
        {/* Page 2: Dashboard - Full dashboard with charts, tables, and camera */}
        <Route path="/dashboard" element={<App />} />
        
        {/* Page 3: Admin/Settings */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
)
