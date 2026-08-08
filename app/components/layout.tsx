import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, Truck, Clock, MessageCircle, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatWidget } from "./chat-widget";
import { useLanguage } from "@/hooks/use-language";

function useCountdown() {
  const getSecondsUntilSunday = () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + (7 - now.getDay()) % 7 || 7);
    end.setHours(23, 59, 59, 0);
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  };
  const [secs, setSecs] = useState(getSecondsUntilSunday);
  useEffect(() => {
    const t = setInterval(() => setSecs(getSecondsUntilSunday()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return { h, m, s };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, t, toggleLang } = useLanguage();
  const isHome = location === "/";
  const countdown = useCountdown();

  const navLinks = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.about, path: "/about" },
    { name: t.nav.services, path: "/services" },
    { name: t.nav.pricing, path: "/pricing" },
    { name: t.nav.contact, path: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const isAr = lang === "ar";
  const transparent = isHome && !isScrolled;

  return (
    <div className={`flex min-h-screen flex-col ${isAr ? "font-arabic" : "font-sans"}`}>

      {/* Promo Banner — fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white text-center text-[13px] font-bold py-2.5 px-4">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
        <span className="relative inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="bg-white text-orange-600 rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide animate-pulse">🔥 {lang === "ar" ? "عرض محدود" : "Limited Offer"}</span>
          {lang === "ar" ? "احجز هذا الأسبوع ووفّر 10% على أي نقلة!" : "Book this week & save 10% on any move!"}
          <span className="hidden sm:inline-flex items-center gap-1 bg-black/20 rounded-full px-2.5 py-0.5 text-xs font-mono tabular-nums">
            ⏱ {countdown.h}:{countdown.m}:{countdown.s}
          </span>
          <Link href="/book" className="underline underline-offset-2 hover:no-underline font-black text-yellow-200">
            {lang === "ar" ? "احجز الآن ←" : "Claim offer →"}
          </Link>
        </span>
      </div>

      {/* Header */}
      <header className={`header-blur fixed left-0 right-0 z-40 top-[41px] ${
        transparent
          ? "bg-transparent"
          : "bg-white/97 backdrop-blur-md shadow-[0_2px_20px_rgba(16,30,54,0.08)] border-b border-border/30"
      }`}>
        <div className="container mx-auto flex h-[68px] items-center justify-between px-4 md:px-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" data-testid="link-logo">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
              transparent ? "bg-white text-primary" : "bg-primary text-white"
            }`}>
              <Truck className="h-5 w-5" />
            </div>
            <span className={`font-serif text-[1.35rem] font-bold tracking-tight transition-colors ${
              transparent ? "text-white" : "text-foreground"
            }`}>
              SwiftMove<span className={transparent ? " text-blue-300" : " text-primary"}> & Clean</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`nav-link text-sm font-semibold transition-colors hover:opacity-100 ${
                  location === link.path
                    ? transparent ? "text-white opacity-100 nav-link-active" : "text-primary nav-link-active"
                    : transparent ? "text-white/75" : "text-foreground/70"
                }`}
                data-testid={`link-nav-${link.name}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <a href="tel:+19482232328" className={`hidden lg:flex items-center gap-1.5 text-sm font-bold transition-colors ${
              transparent ? "text-white/80 hover:text-white" : "text-primary hover:text-primary/80"
            }`}>
              <Phone className="h-3.5 w-3.5" />
              <span>+1 948 223 2328</span>
            </a>

            <button
              onClick={toggleLang}
              className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                transparent
                  ? "border-white/30 bg-white/10 text-white hover:bg-white hover:text-primary"
                  : "border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white hover:border-primary"
              }`}
              aria-label="Toggle language"
              data-testid="button-lang-toggle"
            >
              {lang === "en" ? "🇸🇦 AR" : "🇬🇧 EN"}
            </button>

            <Link href="/book" data-testid="link-nav-book">
              <Button className={`hidden md:inline-flex btn-shine h-9 px-5 text-sm font-bold rounded-full transition-all ${
                transparent
                  ? "bg-white text-primary hover:bg-blue-50 shadow-lg"
                  : "shadow-md hover:shadow-lg"
              }`}>
                {t.nav.book}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>

            <button
              className={`p-1 md:hidden transition-colors ${transparent ? "text-white" : "text-foreground"}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-[68px] bg-white border-b border-border shadow-xl md:hidden">
            <nav className="flex flex-col p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`border-b border-border/40 py-4 text-base font-semibold transition-colors hover:text-primary ${
                    location === link.path ? "text-primary" : "text-foreground/80"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="mt-5 flex flex-col gap-3">
                <a href="tel:+19482232328" className="flex items-center gap-2 text-primary font-bold">
                  <Phone className="h-5 w-5" /><span>+1 948 223 2328</span>
                </a>
                <button onClick={toggleLang} className="flex items-center justify-center gap-2 rounded-full border-2 border-primary px-4 py-2 text-sm font-bold text-primary">
                  {lang === "en" ? "🇸🇦 العربية" : "🇬🇧 English"}
                </button>
                <Link href="/book" className="w-full">
                  <Button className="w-full btn-shine rounded-full">{t.nav.book}</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      {/* banner=41px + header=68px = 109px total offset for non-home pages */}
      <main className={`flex-1 ${isHome ? "mt-[41px]" : "pt-[68px] mt-[41px]"}`}>{children}</main>

      {/* Footer */}
      <footer className="bg-[hsl(218,50%,10%)] text-white">
        {/* CTA strip */}
        <div className="border-b border-white/10 py-10">
          <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-blue-300 uppercase tracking-widest mb-1">Ready to move?</p>
              <h3 className="font-serif text-2xl font-bold text-white">{t.footer.tagline}</h3>
            </div>
            <Link href="/book">
              <Button size="lg" className="btn-shine bg-white text-primary hover:bg-blue-50 font-bold rounded-full shadow-xl h-12 px-8">
                {t.nav.book} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Link href="/" className="mb-5 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <span className="font-serif text-xl font-bold">SwiftMove<span className="text-blue-400"> & Clean</span></span>
              </Link>
              <p className="text-sm text-white/50 leading-relaxed mb-5">Professional UK house removals. Pay online, team arrives in 20 minutes.</p>
              <div className="flex gap-3">
                {[{ href: "tel:+19482232328", Icon: Phone }, { href: "mailto:helloswiftmoveandclean.co.uk@cutsup.com", Icon: Mail }].map(({ href, Icon }) => (
                  <a key={href} href={href} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">{t.footer.quickLinks}</h3>
              <ul className="flex flex-col gap-3">
                {[{ name: t.nav.home, path: "/" }, { name: t.nav.about, path: "/about" }, { name: t.nav.services, path: "/services" }, { name: t.nav.pricing, path: "/pricing" }, { name: t.nav.contact, path: "/contact" }].map(l => (
                  <li key={l.path}><Link href={l.path} className="text-sm text-white/55 hover:text-white transition-colors">{l.name}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">{t.footer.services}</h3>
              <ul className="flex flex-col gap-3">
                {t.services.items.slice(0, 5).map(s => (
                  <li key={s.title}><Link href="/services" className="text-sm text-white/55 hover:text-white transition-colors">{s.title}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">{t.footer.contact}</h3>
              <ul className="flex flex-col gap-4 text-sm text-white/55">
                {[
                  { Icon: Phone, color: "text-blue-400", val: "+1 948 223 2328", href: "tel:+19482232328" },
                  { Icon: Mail, color: "text-blue-400", val: "helloswiftmoveandclean.co.uk@cutsup.com", href: null },
                  { Icon: Clock, color: "text-yellow-400", val: t.footer.hours, href: null },
                ].map(({ Icon, color, val, href }, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    {href ? <a href={href} className="hover:text-white transition-colors">{val}</a> : <span className="text-xs leading-relaxed">{val}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <p>&copy; {new Date().getFullYear()} {t.footer.copyright}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" /><span>All systems operational</span></div>
              <Link href="/admin" className="opacity-30 hover:opacity-70 transition-opacity text-[10px] tracking-widest uppercase">Admin</Link>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}
