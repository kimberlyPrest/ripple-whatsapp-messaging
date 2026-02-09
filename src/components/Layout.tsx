/* Layout Component - A component that wraps the main content of the app
   - This component is used in the App.tsx file to wrap the main content of the app */

import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function Layout() {
  return (
    <main className="flex flex-col min-h-screen font-body">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </main>
  )
}
