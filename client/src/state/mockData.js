// Mock data. Luego se reemplaza por llamadas al backend.

function daysAgoIso(daysAgo) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export function getMockInvoices() {
  return [
    {
      id: '1',
      number: 'INV-2024-001',
      vendor: 'Adobe Systems',
      date: daysAgoIso(3),
      total: 45990,
      status: 'paid',
      history: [{ at: daysAgoIso(3), from: 'pending', to: 'paid' }],
    },
    {
      id: '2',
      number: 'INV-2024-042',
      vendor: 'Amazon Web Services',
      date: daysAgoIso(6),
      total: 1240000,
      status: 'pending',
      history: [{ at: daysAgoIso(6), from: 'paid', to: 'pending' }],
    },
    {
      id: '3',
      number: 'INV-2024-089',
      vendor: 'Digital Ocean Inc',
      date: daysAgoIso(10),
      total: 89000,
      status: 'paid',
      history: [{ at: daysAgoIso(10), from: 'pending', to: 'paid' }],
    },
    {
      id: '4',
      number: 'INV-2024-112',
      vendor: 'Stripe Payments',
      date: daysAgoIso(14),
      total: 210500,
      status: 'pending',
      history: [{ at: daysAgoIso(14), from: 'paid', to: 'pending' }],
    },
    {
      id: '5',
      number: 'INV-2024-140',
      vendor: 'Microsoft Azure',
      date: daysAgoIso(24),
      total: 890000,
      status: 'paid',
      history: [{ at: daysAgoIso(24), from: 'pending', to: 'paid' }],
    },
    {
      id: '6',
      number: 'INV-2024-155',
      vendor: 'Slack Technologies',
      date: daysAgoIso(31),
      total: 150000,
      status: 'pending',
      history: [{ at: daysAgoIso(31), from: 'paid', to: 'pending' }],
    },
    {
      id: '7',
      number: 'INV-2024-199',
      vendor: 'Figma Design',
      date: daysAgoIso(40),
      total: 300000,
      status: 'paid',
      history: [{ at: daysAgoIso(40), from: 'pending', to: 'paid' }],
    },
  ]
}
