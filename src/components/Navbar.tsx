import { useRef, useState, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* Register GSAP plugin at module level */
gsap.registerPlugin(ScrollTrigger)

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuItemsRef = useRef<HTMLDivElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  /* Scroll-triggered background change */
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 'top -80',
      end: 99999,
      onEnter: () => setScrolled(true),
      onLeaveBack: () => setScrolled(false),
    })
    return () => {
      trigger.kill()
    }
  }, [])

  /* Mobile menu paper-fold animation */
  useEffect(() => {
    if (!menuRef.current || !menuItemsRef.current) return

    const items = menuItemsRef.current.querySelectorAll('a')

    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      gsap.fromTo(
        menuRef.current,
        { clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)', opacity: 0 },
        {
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          opacity: 1,
          duration: 0.45,
          ease: 'power3.out',
        }
      )
      gsap.fromTo(
        items,
        { y: 30, opacity: 0, rotateX: -15 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.15,
        }
      )
    } else {
      document.body.style.overflow = ''
      gsap.to(menuRef.current, {
        clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
        opacity: 0,
        duration: 0.35,
        ease: 'power3.in',
      })
    }
  }, [mobileOpen])

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault()
      setMobileOpen(false)
      const el = document.querySelector(href)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    []
  )

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-bg/95 backdrop-blur-lg shadow-[0_1px_0_rgba(255,255,255,0.06)]'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between max-w-[1200px] mx-auto px-md h-16">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, '#hero')}
            className="font-bold tracking-tight font-display text-xl text-ink"
          >
            Zain Haider
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="font-medium transition-colors font-body text-sm text-muted hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden relative z-50 flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span
              className={`block w-6 h-0.5 bg-ink transition-all duration-300 ${
                mobileOpen ? 'rotate-45 translate-y-1' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-ink transition-all duration-300 ${
                mobileOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-ink transition-all duration-300 ${
                mobileOpen ? '-rotate-45 -translate-y-1' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        ref={menuRef}
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center md:hidden bg-bg ${
          mobileOpen ? '' : 'pointer-events-none'
        }`}
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
          opacity: 0,
        }}
      >
        <div ref={menuItemsRef} className="flex flex-col items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="font-semibold font-display text-3xl text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
