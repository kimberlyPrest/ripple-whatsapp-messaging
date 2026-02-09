import { Ban, CheckCircle2 } from 'lucide-react'
import { FadeIn } from '@/components/FadeIn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Comparison = () => {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-slate-900 mb-6">
              Por que escolher o Ripple?
            </h2>
            <p className="text-slate-600 text-lg">
              Deixe para trás os métodos manuais e arriscados. Mude para a
              automação inteligente.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Negative Card */}
          <FadeIn delay={100} className="h-full">
            <Card className="h-full border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center mb-4 text-slate-500">
                  <Ban className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-700">
                  Fim das tarefas manuais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 leading-relaxed">
                  Enviar mensagens uma a uma não é escalável. Você perde horas
                  copiando e colando, sujeito a erros humanos e baixa
                  produtividade, sem garantir resultados.
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Positive Card */}
          <FadeIn delay={200} className="h-full">
            <Card className="h-full border-ripple-green/30 bg-white shadow-xl shadow-ripple-green/5 relative overflow-hidden group hover:border-ripple-green/50 transition-colors duration-300">
              <div className="absolute top-0 right-0 bg-ripple-green text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMENDADO
              </div>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 text-ripple-dark-green group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Blindagem Anti-Bloqueio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
                  Nossa tecnologia exclusiva simula o comportamento humano com
                  pausas inteligentes, protegendo seu número enquanto você
                  escala suas vendas com total segurança.
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
