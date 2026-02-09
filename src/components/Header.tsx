import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Header = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent',
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-border/40 py-3 shadow-sm'
          : 'bg-transparent py-5',
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-ripple-green rounded-md flex items-center justify-center text-white font-heading font-extrabold text-lg md:text-xl shadow-lg transition-transform group-hover:scale-105">
            R
          </div>
          <span className="font-heading font-extrabold text-lg md:text-xl text-slate-900 tracking-tight">
            Ripple
          </span>
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          <a
            href="#"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
          >
            Login
          </a>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            Começar Grátis
          </Button>
        </div>
      </div>
    </header>
  )
}
