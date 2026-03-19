import React from 'react'
import Modal from './Modal'
import Icon from './Icon'

/**
 * Confirm modal (dark, SaaS-style).
 *
 * Props:
 * - open: boolean
 * - title: string
 * - message: string | ReactNode
 * - confirmText?: string
 * - cancelText?: string
 * - tone?: 'default' | 'danger'
 * - onConfirm: () => void
 * - onClose: () => void
 */
export default function ConfirmModal({
  open,
  title = 'Confirmar',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  tone = 'default',
  onConfirm,
  onClose,
}) {
  const confirmBtnClass = tone === 'danger' ? 'danger-btn' : 'primary-btn'

  const footer = (
    <div className="confirm-actions">
      <button className="secondary-btn" onClick={onClose}>
        {cancelText}
      </button>
      <button
        className={confirmBtnClass}
        onClick={() => {
          onConfirm?.()
          onClose?.()
        }}
      >
        {confirmText}
      </button>
    </div>
  )

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={footer}
    >
      <div className="confirm-body">
        <div className={tone === 'danger' ? 'confirm-hero danger' : 'confirm-hero'}>
          <Icon name={tone === 'danger' ? 'alert' : 'help'} size={20} />
        </div>
        <div className="confirm-message">{message}</div>
      </div>
    </Modal>
  )
}
