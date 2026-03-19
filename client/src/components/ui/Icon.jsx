import React from 'react'
import {
  Bell,
  CloudUpload,
  Paperclip,
  FileText,
  Clock,
  HandCoins,
  Wallet,
  Receipt,
  X,
  HelpCircle,
  AlertTriangle,
  Check,
} from 'lucide-react'

/**
 * Icon wrapper backed by lucide-react.
 *
 * Keeps the existing API so we don't have to refactor the whole app:
 * - name: string (legacy names)
 * - size: number
 * - className: string
 * - title: string (optional)
 */
export default function Icon({ name, size = 20, className = '', title }) {
  const ariaHidden = title ? undefined : true
  const ariaLabel = title ? title : undefined

  const common = {
    size,
    className,
    role: 'img',
    'aria-hidden': ariaHidden,
    'aria-label': ariaLabel,
    // Un estilo único y consistente para todo el set.
    // Lucide usa stroke="currentColor" por defecto; esto hace que se vea igual en toda la UI.
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const map = {
    bell: Bell,
    cloudUpload: CloudUpload,
    paperclip: Paperclip,
    fileText: FileText,
    clock: Clock,
    cash: HandCoins,
    wallet: Wallet,
    receipt: Receipt,
    x: X,
    help: HelpCircle,
    alert: AlertTriangle,
    check: Check,
  }

  const Comp = map[name]
  if (!Comp) return null
  return <Comp {...common} />
}
