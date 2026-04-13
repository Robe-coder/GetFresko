export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🥬</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">GetFresko</h1>
          <p className="mt-1 text-sm text-gray-500">Tu despensa inteligente</p>
        </div>
        {children}
      </div>
    </div>
  )
}
