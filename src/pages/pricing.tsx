import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Clock, Users, Shield, Info, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});
const fadeUpView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Pricing() {
  const { t } = useLanguage();
  const p = t.pricing;
  const trustBadges = [
    { icon: Clock, text: p.teamIn20, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { icon: Shield, text: p.fullyInsured, color: "text-green-600 bg-green-50 border-green-200" },
    { icon: Users, text: p.vettedPros, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { icon: Check, text: p.noFees, color: "text-orange-600 bg-orange-50 border-orange-200" },
  ];

  return (
    <>
      <Helmet>
        <title>House Removal Prices UK | SwiftMove & Clean</title>
        <meta name="description" content="Transparent, competitive house removal prices across the UK. No hidden fees." />
      </Helmet>

      {/* Hero */}
      <section className="hero-mesh relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="container relative mx-auto px-4 md:px-6 text-center">
          <motion.div {...fadeUp(0)}>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">Transparent Pricing</p>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">{p.title}</h1>
            <p className="max-w-[620px] mx-auto text-lg text-white/60 mb-10">{p.desc}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {trustBadges.map(({ icon: Icon, text, color }) => (
                <div key={text} className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-2 text-sm font-medium text-white/80">
                  <Icon className="h-4 w-4 text-blue-300" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-14 md:h-18" preserveAspectRatio="none">
            <path d="M0 70L1440 70L1440 20C1200 70 720 0 0 40L0 70Z" fill="hsl(210,30%,98%)" />
          </svg>
        </div>
      </section>

      {/* Packages grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-7xl mx-auto">
            {p.pricingPackages.map((pkg, i) => (
              <motion.div key={pkg.label} {...fadeUp(i * 0.07)}
                className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  pkg.popular
                    ? "bg-primary text-white shadow-[0_16px_60px_rgba(16,30,100,0.3)] ring-0"
                    : "bg-card border border-border shadow-sm hover:shadow-[0_12px_32px_rgba(16,30,54,0.10)] hover:border-primary/30"
                }`}>
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-yellow-400 text-yellow-900 px-4 py-1 text-xs font-black whitespace-nowrap shadow-lg">
                    <Zap className="h-3 w-3" />
                    {t.mostPopular}
                  </div>
                )}

                <div className="text-4xl mb-4">{pkg.icon}</div>
                <h3 className={`font-bold text-xl mb-1 ${pkg.popular ? "text-white" : ""}`}>{pkg.label}</h3>
                <div className={`flex items-center gap-1.5 text-xs mb-5 ${pkg.popular ? "text-blue-200" : "text-muted-foreground"}`}>
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{pkg.team} · {pkg.van}</span>
                </div>

                <div className="mb-1">
                  <span className={`text-4xl font-black ${pkg.popular ? "text-white" : "text-primary"}`}>{pkg.from}</span>
                </div>
                <div className={`text-xs mb-1 ${pkg.popular ? "text-blue-200" : "text-muted-foreground"}`}>{t.fullMove}</div>
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold mb-6 rounded-full px-2.5 py-1 w-fit ${
                  pkg.popular ? "bg-white/15 text-white" : "bg-primary/8 text-primary"
                }`}>
                  <Zap className="h-3 w-3" />
                  {t.depositLabel}: {pkg.deposit} {t.todayLabel}
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {pkg.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                        pkg.popular ? "bg-white/20" : "bg-primary/10"
                      }`}>
                        <Check className={`h-2.5 w-2.5 ${pkg.popular ? "text-white" : "text-primary"}`} />
                      </div>
                      <span className={pkg.popular ? "text-blue-100" : "text-muted-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/book">
                  <Button className={`w-full rounded-full font-bold transition-all ${
                    pkg.popular
                      ? "bg-white text-primary hover:bg-blue-50 shadow-lg"
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-white border-0"
                  }`} data-testid={`button-pricing-book-${i}`}>
                    {p.bookPackage}
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Info box */}
          <motion.div {...fadeUpView(0.2)} className="mt-12 max-w-3xl mx-auto rounded-2xl bg-primary/5 border border-primary/15 p-6 md:p-8 flex gap-4 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2">{p.infoTitle}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {p.infoDesc} <Link href="/contact" className="text-primary underline underline-offset-2 hover:no-underline">{p.contactUs}</Link>
              </p>
            </div>
          </motion.div>

          {/* Add-ons table */}
          <motion.div {...fadeUpView(0.25)} className="mt-16 max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-bold mb-2 text-center">{p.addOnsTitle}</h2>
            <p className="text-center text-muted-foreground text-sm mb-8">Optional extras you can add to any package</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary/5 border-b border-border">
                  <tr>{p.addOnHeaders.map(h => <th key={h} className="p-4 font-semibold text-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {p.addOns.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/40 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{row.s}</td>
                      <td className="p-4 text-muted-foreground">{row.d}</td>
                      <td className="p-4 font-bold text-primary text-right">{row.p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-mesh relative overflow-hidden py-20">
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-indigo-900/80" />
        <div className="container relative mx-auto px-4 text-center">
          <motion.div {...fadeUpView()}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">{p.ctaTitle}</h2>
            <p className="text-white/65 mb-8 max-w-[480px] mx-auto text-lg">{p.ctaDesc}</p>
            <Link href="/book">
              <Button size="lg" className="btn-shine bg-white text-primary font-bold rounded-full h-13 px-10 shadow-2xl hover:bg-blue-50 text-base" data-testid="button-pricing-cta">
                {p.ctaBtn} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
