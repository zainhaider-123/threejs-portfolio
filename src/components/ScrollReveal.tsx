import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

/* Register GSAP plugin at module level */
gsap.registerPlugin(ScrollTrigger)

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  stagger?: boolean
  delay?: number
}

export default function ScrollReveal({
  children,
  className = '',
  stagger = false,
  delay = 0,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useGSAP(
    () => {
      if (!containerRef.current) return

      if (prefersReducedMotion) {
        gsap.set(containerRef.current, { opacity: 1, y: 0, scale: 1 })
        return
      }

      const targets = stagger
        ? containerRef.current.children
        : containerRef.current

      gsap.from(targets, {
        y: 40,
        opacity: 0,
        scale: 0.98,
        duration: 0.7,
        ease: 'power3.out',
        stagger: stagger ? 0.08 : 0,
        delay,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      })
    },
    { scope: containerRef }
  )

  return (
    <div
      ref={containerRef}
      className={className}
      style={prefersReducedMotion ? undefined : { opacity: 0 }}
    >
      {children}
    </div>
  )
}
