import React, { useEffect, useMemo, useState } from 'react'

import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InvoicesPage from './pages/InvoicesPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'

import PdfUploadModal from './features/pdf/PdfUploadModal'
import { addInvoiceFromExtract } from './state/mockStore'

const ROUTES = {
  login: { key: 'login', label: 'Login' },
  home: { key: 'home', label: 'Inicio' },
  invoices: { key: 'invoices', label: 'Facturas' },
  stats: { key: 'stats', label: 'Estadísticas' },
  settings: { key: 'settings', label: 'Configuración' },
}

function getRouteFromHash() {
  const hash = window.location.hash.replace('#', '')
  const key = (hash || 'home').toLowerCase()
  return ROUTES[key] ? key : 'home'
}

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false)
  const [routeKey, setRouteKey] = useState(getRouteFromHash)
  const [pdfOpen, setPdfOpen] = useState(false)

  useEffect(() => {
    const onHash = () => setRouteKey(getRouteFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const currentRouteKey = useMemo(() => {
    if (!isAuthed) return 'login'
    return routeKey === 'login' ? 'home' : routeKey
  }, [isAuthed, routeKey])

  const Page = useMemo(() => {
    switch (currentRouteKey) {
      case 'login':
        return <LoginPage onLogin={() => setIsAuthed(true)} />
      case 'home':
        return <DashboardPage onUploadClick={() => setPdfOpen(true)} />
      case 'invoices':
        return <InvoicesPage />
      case 'stats':
        return <StatsPage />
      case 'settings':
        return <SettingsPage onLogout={() => setIsAuthed(false)} />
      default:
        return <DashboardPage />
    }
  }, [currentRouteKey])

  if (!isAuthed) {
    return <div className="auth-shell">{Page}</div>
  }

  return (
    <div className="app-shell">
      <Sidebar active={currentRouteKey} />
      <div className="app-main">
        <Topbar onUploadClick={() => setPdfOpen(true)} />
        <div className="app-content">{Page}</div>
      </div>

      <PdfUploadModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        onExtracted={({ file, extracted }) => {
          addInvoiceFromExtract({
            ...extracted,
            pdfFile: file,
            pdfFilename: file?.name,
          })
          // navega a facturas para ver el resultado
          window.location.hash = '#invoices'
        }}
      />
    </div>
  )
}
