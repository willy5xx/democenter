import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { PresentationPage } from './pages/presentation.tsx'
import { AdminPage } from './pages/admin.tsx'
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Page 1: Presentation Mode (Demo) */}
        <Route path="/" element={<PresentationPage />} />
        
        {/* Page 2: Admin/Settings */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
)
