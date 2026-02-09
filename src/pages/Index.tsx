/* Home Page - Main Landing Page for Ripple */
import { Hero } from '@/components/landing/Hero'
import { Stats } from '@/components/landing/Stats'
import { Comparison } from '@/components/landing/Comparison'
import { Process } from '@/components/landing/Process'
import { Features } from '@/components/landing/Features'
import { FinalCTA } from '@/components/landing/FinalCTA'

const Index = () => {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <Stats />
      <Comparison />
      <Process />
      <Features />
      <FinalCTA />
    </div>
  )
}

export default Index
