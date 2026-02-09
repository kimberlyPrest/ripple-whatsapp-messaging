import { ShieldCheck, Store, AlertTriangle, CalendarClock } from 'lucide-react'
import { FadeIn } from '@/components/FadeIn'

export const Features = () => {
  const features = [
    {
      icon: ShieldCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      title: 'Blindagem de Conta',
      description:
        'Intervalos humanizados e pausas periódicas automáticas para proteger seu número.',
    },
    {
      icon: Store,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      title: 'Horário Comercial',
      description:
        'O sistema pausa automaticamente fora do seu horário de atendimento definido.',
    },
    {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      title: 'Gestão de Erros',
      description:
        'Notificações instantâneas de mensagens falhadas para correção rápida na lista.',
    },
    {
      icon: CalendarClock,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      title: 'Agendamento Estratégico',
      description:
        'Planeje suas campanhas com antecedência e deixe o Ripple trabalhar por você.',
    },
  ]

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <FadeIn>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-slate-900">
              Recursos Poderosos
            </h2>
            <p className="text-slate-600 mt-4 text-lg">
              Tudo o que você precisa para uma operação profissional.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FadeIn key={index} delay={index * 100} className="h-full">
              <div className="h-full p-6 rounded-3xl border border-slate-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-heading font-bold text-lg text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
