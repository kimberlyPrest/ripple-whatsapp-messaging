import { Table, Settings, Send } from 'lucide-react'
import { FadeIn } from '@/components/FadeIn'

export const Process = () => {
  return (
    <section className="py-20 md:py-32 bg-ripple-surface">
      <div className="container mx-auto px-4 md:px-6">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-ripple-dark-green font-bold text-sm tracking-wider uppercase mb-2 block">
              Como Funciona
            </span>
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-slate-900">
              Comece em 3 passos simples
            </h2>
          </div>
        </FadeIn>

        <div className="relative max-w-5xl mx-auto">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {/* Step 1 */}
            <FadeIn delay={100} className="group">
              <div className="flex flex-col items-center text-center bg-white md:bg-transparent p-6 md:p-0 rounded-xl shadow-sm md:shadow-none border border-slate-100 md:border-none">
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center mb-6 relative group-hover:shadow-xl group-hover:border-ripple-green/30 transition-all duration-300">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-ripple-green flex items-center justify-center text-slate-900 font-bold border-2 border-white">
                    1
                  </div>
                  <Table className="w-10 h-10 text-slate-400 group-hover:text-ripple-green transition-colors duration-300" />
                </div>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-3">
                  Importe sua Lista
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  Carregue sua planilha de contatos (.csv ou .xlsx) para
                  preparar sua audiência.
                </p>
              </div>
            </FadeIn>

            {/* Step 2 */}
            <FadeIn delay={200} className="group">
              <div className="flex flex-col items-center text-center bg-white md:bg-transparent p-6 md:p-0 rounded-xl shadow-sm md:shadow-none border border-slate-100 md:border-none">
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center mb-6 relative group-hover:shadow-xl group-hover:border-ripple-green/30 transition-all duration-300">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border-2 border-white">
                    2
                  </div>
                  <Settings className="w-10 h-10 text-slate-400 group-hover:text-ripple-green transition-colors duration-300" />
                </div>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-3">
                  Configure o Disparo
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  Defina as configurações de envio, intervalos e horários da
                  campanha.
                </p>
              </div>
            </FadeIn>

            {/* Step 3 */}
            <FadeIn delay={300} className="group">
              <div className="flex flex-col items-center text-center bg-white md:bg-transparent p-6 md:p-0 rounded-xl shadow-sm md:shadow-none border border-slate-100 md:border-none">
                <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center mb-6 relative group-hover:shadow-xl group-hover:border-ripple-green/30 transition-all duration-300">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border-2 border-white">
                    3
                  </div>
                  <Send className="w-10 h-10 text-slate-400 group-hover:text-ripple-green transition-colors duration-300 ml-1" />
                </div>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-3">
                  Inicie o Disparo
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  Acompanhe o envio em tempo real e veja os resultados chegando.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  )
}
