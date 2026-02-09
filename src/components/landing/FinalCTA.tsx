import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/FadeIn'

export const FinalCTA = () => {
  return (
    <section className="py-24 bg-ripple-dark relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-ripple-green/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-ripple-green/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <FadeIn>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-white mb-8 leading-tight">
              Pronto para profissionalizar seus disparos?
            </h2>
            <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Junte-se a milhares de empresas que usam o Ripple para vender mais
              no WhatsApp com segurança.
            </p>

            <div className="flex flex-col items-center gap-6">
              <Button
                size="lg"
                className="bg-ripple-green hover:bg-ripple-dark-green text-slate-900 font-bold text-lg h-14 px-10 shadow-glow-green hover:shadow-glow-large transition-all hover:scale-105"
              >
                Começar Agora - Grátis
              </Button>
              <span className="text-sm text-slate-400">
                Sem cartão de crédito necessário • 14 dias de teste grátis
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
