import React from 'react'
import Icon from '../ui/Icon'

export default function Topbar({ onUploadClick }) {
  return (
    <header className="topbar">
      <div className="search">
        <input
          placeholder="Buscar facturas, proveedores o fechas..."
          aria-label="Buscar"
        />
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" title="Notificaciones" aria-label="Notificaciones">
          <Icon name="bell" size={18} />
        </button>
      </div>
    </header>
  )
}
