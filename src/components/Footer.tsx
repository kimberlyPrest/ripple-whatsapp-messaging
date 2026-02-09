export const Footer = () => {
  return (
    <footer className="border-t border-slate-100 bg-white py-8">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white font-heading font-bold text-xs">
            R
          </div>
          <span className="font-heading font-bold text-slate-900">Ripple</span>
        </div>
        <p className="text-sm text-slate-500">
          © 2024 Ripple. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
