'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Materials', href: '/materials', icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )},
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div>
        <div className="min-h-screen bg-gray-100">
          <main className="pt-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 