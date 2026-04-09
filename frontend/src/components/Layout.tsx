import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      {/* Offset main content by sidebar width */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
