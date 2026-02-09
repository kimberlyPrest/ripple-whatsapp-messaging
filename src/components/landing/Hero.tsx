import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/FadeIn'

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden bg-ripple-surface">
      {/* Decorative background grid */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-ripple-green/20 shadow-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ripple-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ripple-green"></span>
              </span>
              <span className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                Tecnologia Anti-Bloqueio 2.0
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[1.1] text-slate-900 mb-6 tracking-tight">
              Transforme suas listas em{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ripple-dark-green to-ripple-green">
                resultados reais
              </span>{' '}
              no WhatsApp
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              A plataforma mais segura para envios em massa. Automatize sua
              comunicação com humanização real e proteja seu número contra
              bloqueios.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-ripple-green hover:bg-ripple-dark-green text-slate-900 font-bold text-lg h-14 px-8 shadow-glow-green hover:shadow-glow-large transition-all hover:-translate-y-1"
              >
                Começar Agora - Grátis
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-lg h-14 px-8 gap-2 group transition-all hover:-translate-y-1"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Play className="w-3 h-3 ml-0.5 fill-slate-700" />
                </div>
                Ver Demo
              </Button>
            </div>
          </FadeIn>
        </div>

        {/* Mockup */}
        <FadeIn delay={500} className="relative mx-auto max-w-6xl">
          <div className="relative rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9]">
            {/* Browser Bar */}
            <div className="absolute top-0 left-0 right-0 h-8 md:h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2 z-20">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              <div className="mx-auto w-1/3 h-5 bg-slate-200/50 rounded-md hidden md:block"></div>
            </div>

            <div className="absolute top-8 md:top-10 inset-0 flex bg-slate-50">
              {/* Sidebar */}
              <div className="w-16 md:w-64 border-r border-slate-100 bg-white hidden md:flex flex-col p-4 gap-6 z-10">
                <div className="h-8 w-8 bg-ripple-green/20 rounded-md mb-4"></div>
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-8 w-full rounded-md flex items-center px-3 gap-3 ${i === 2 ? 'bg-ripple-surface text-ripple-dark-green' : 'opacity-60'}`}
                    >
                      <div
                        className={`w-4 h-4 rounded ${i === 2 ? 'bg-ripple-green' : 'bg-slate-200'}`}
                      ></div>
                      <div
                        className={`h-2.5 rounded-full w-24 ${i === 2 ? 'bg-slate-900/10' : 'bg-slate-100'}`}
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto h-24 w-full bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="h-2 w-12 bg-slate-200 rounded-full mb-2"></div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full">
                    <div className="h-full w-3/4 bg-ripple-green rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div className="h-8 w-32 md:w-48 bg-slate-200 rounded-md"></div>
                  <div className="h-10 w-32 bg-ripple-green rounded-md shadow-lg shadow-ripple-green/20"></div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                  {[
                    {
                      bg: 'bg-blue-50',
                      icon: 'bg-blue-200',
                      text: 'bg-blue-900/10',
                    },
                    {
                      bg: 'bg-green-50',
                      icon: 'bg-green-200',
                      text: 'bg-green-900/10',
                    },
                    {
                      bg: 'bg-purple-50',
                      icon: 'bg-purple-200',
                      text: 'bg-purple-900/10',
                    },
                  ].map((style, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-4 md:p-6 ${style.bg} border border-white/50 shadow-sm`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${style.icon} mb-4 opacity-80`}
                      ></div>
                      <div
                        className={`h-6 w-16 rounded-md ${style.text} mb-2`}
                      ></div>
                      <div className="h-3 w-24 bg-slate-900/5 rounded-full"></div>
                    </div>
                  ))}
                </div>

                {/* Table Area */}
                <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm p-4 md:p-6 flex flex-col gap-4">
                  <div className="flex gap-4 mb-4 border-b border-slate-50 pb-4">
                    <div className="h-4 w-20 bg-slate-100 rounded-full"></div>
                    <div className="h-4 w-32 bg-slate-100 rounded-full"></div>
                    <div className="h-4 w-24 bg-slate-100 rounded-full ml-auto"></div>
                  </div>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="flex items-center gap-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-slate-50"></div>
                      <div className="flex-1">
                        <div className="h-3 w-32 bg-slate-100 rounded-full mb-2"></div>
                        <div className="h-2 w-20 bg-slate-50 rounded-full"></div>
                      </div>
                      <div className="w-20 h-6 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                        <div className="h-1.5 w-10 bg-green-300 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
