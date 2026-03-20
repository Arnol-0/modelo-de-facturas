import React, { useMemo, useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login') // login | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  const title = useMemo(() => {
    if (mode === 'forgot') return 'Recuperar contraseña'
    return 'Bienvenido de vuelta'
  }, [mode])

  const subtitle = useMemo(() => {
    if (mode === 'forgot') return 'Te enviaremos un enlace para restablecer tu contraseña.'
    return 'Gestiona y controla tus facturas de forma segura.'
  }, [mode])

  const onSubmit = (e) => {
    e.preventDefault()
    // Mock auth: luego se conecta a backend
    if (mode === 'forgot') {
      alert('Listo: revisa tu email (mock).')
      setMode('login')
      return
    }
    onLogin?.()
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="brand-mark">F</div>
          <div>
            <div className="brand-name">Punto factura</div>
            <div className="brand-sub">Facturas seguras</div>
          </div>
        </div>

        <h1 className="login-title">{title}</h1>
        <p className="login-subtitle">{subtitle}</p>

        <form onSubmit={onSubmit} className="form">
          <label>
            <span>Correo electrónico</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>

          {mode !== 'forgot' && (
            <label>
              <span>Contraseña</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>
          )}

          {mode === 'login' && (
            <div className="row between">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="switch-track" aria-hidden="true">
                  <span className="switch-knob" />
                </span>
                <span className="switch-label">Mantener sesión iniciada</span>
              </label>
              <button type="button" className="link" onClick={() => setMode('forgot')}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button className="primary-btn full" type="submit">
            {mode === 'forgot' ? 'Enviar enlace de recuperación' : 'Ingresar al dashboard'}
          </button>
        </form>

        <div className="footer-note">
          ¿No tienes cuenta? Contacta con el administrador para poder crearla.
        </div>
      </div>
    </div>
  )
}
