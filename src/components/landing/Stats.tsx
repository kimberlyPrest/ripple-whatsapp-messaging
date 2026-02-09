import { FadeIn } from '@/components/FadeIn'

export const Stats = () => {
  return (
    <section className="bg-slate-900 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4 md:px-6">
        <FadeIn className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center p-4">
            <span className="font-heading font-extrabold text-5xl md:text-6xl text-ripple-green mb-2 tracking-tight">
              99%
            </span>
            <span className="text-slate-300 font-medium text-lg">
              Taxa de Entrega
            </span>
          </div>
          <div className="flex flex-col items-center text-center p-4">
            <span className="font-heading font-extrabold text-5xl md:text-6xl text-ripple-green mb-2 tracking-tight">
              80%
            </span>
            <span className="text-slate-300 font-medium text-lg">
              Redução no Tempo Operacional
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
