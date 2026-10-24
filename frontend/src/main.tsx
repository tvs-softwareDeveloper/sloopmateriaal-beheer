import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Dashboard from './Dashboard.tsx'
import Materials from './Pages/Materials'
import Layout from './Layout.tsx'
import { LanguageProvider } from '../src/components/LanguageContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <Routes>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/pages/Dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/pages/Materials" element={<Layout><Materials /></Layout>} />
            <Route path="*" element={<Layout><Dashboard /></Layout>} />
          </Routes>
        </LanguageProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
