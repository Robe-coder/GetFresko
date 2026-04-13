import Link from 'next/link'

interface HeaderProps {
  title?: string
  action?: React.ReactNode
  back?: boolean
}

export function Header({ title, action, back }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 pt-safe">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          {back ? (
            <Link href="/dashboard" className="flex items-center justify-center w-8 h-8 -ml-1 rounded-full hover:bg-gray-100 transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
          ) : (
            <span className="text-xl">🥬</span>
          )}
          {title && (
            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  )
}
