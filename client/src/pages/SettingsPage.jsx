import React from 'react'

export default function SettingsPage({ onLogout }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Configuración</h2>
          <p>Preferencias de la cuenta y seguridad.</p>
        </div>
      </div>

      <section className="card">
        <h3>Cuenta</h3>
        <p className="muted">
          En el siguiente paso conectaremos esta pantalla al backend para cambiar contraseña,
          activar 2FA y gestionar roles.
        </p>
        <div className="row">
          <button className="secondary-btn" onClick={() => alert('Pronto: cambiar contraseña')}>
            Cambiar contraseña
          </button>
          <button className="danger-btn" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </div>
  )
}
