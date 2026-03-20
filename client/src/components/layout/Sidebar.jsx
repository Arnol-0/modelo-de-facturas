import React from 'react'

const NAV = [
  { key: 'home', label: 'Inicio' },
  { key: 'invoices', label: 'Facturas' },
  { key: 'stats', label: 'Estadísticas' },
  { key: 'settings', label: 'Configuración' },
]

function NavItem({ item, active }) {
  const isActive = active === item.key
  return (
    <a
      className={isActive ? 'nav-item active' : 'nav-item'}
      href={`#${item.key}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="nav-dot" />
      <span className="nav-label">{item.label}</span>
    </a>
  )
}

export default function Sidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">F</div>
        <div className="brand-text">
          <div className="brand-name">Punto factura</div>
          <div className="brand-sub">Gestión de facturas</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((it) => (
          <NavItem key={it.key} item={it} active={active} />
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="avatar">US</div>
          <div className="user-meta">
            <div className="user-name">Usuario</div>
            <div className="user-plan">Plan Premium</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
