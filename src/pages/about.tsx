import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, Target, ShieldCheck, HeartHandshake, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";

const fadeUpView = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function About() {
  const { t } = useLanguage();
  const a = t.about;
  const valueIcons = [ShieldCheck, Target, HeartHandshake, Users];
  const valueColors = [
    "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
    "bg-purple-50 text-purple-600 group-hover:bg-purple-600",
    "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
    "bg-orange-50 text-orange-600 group-hover:bg-orange-600",
  ];

  return (
    <>
      <Helmet>
        <title>About Us | SwiftMove & Clean UK</title>
        <meta name="description" content="Learn about SwiftMove & Clean, a trusted UK home removal company." />
      </Helmet>

      {/* Hero */}
      <section className="hero-mesh relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="container relative mx-auto px-4 md:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">Our Story</p>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {a.title} <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">{a.titleHighlight}</span>
            </h1>
            <p className="max-w-[620px] mx-auto text-lg text-white/60">{a.desc}</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-14 md:h-18" preserveAspectRatio="none">
            <path d="M0 70L1440 70L1440 20C1200 70 720 0 0 40L0 70Z" fill="hsl(210,30%,98%)" />
          </svg>
        </div>
      </section>

      {/* Story + Stats */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <motion.div {...fadeUpView()}>
              <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">Who We Are</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">{a.storyTitle}</h2>
              <div className="space-y-5 text-muted-foreground leading-relaxed">
                {a.story.map((para, i) => <p key={i} className="text-[1.05rem]">{para}</p>)}
              </div>
              <div className="mt-8 flex items-center gap-2">
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}</div>
                <span className="text-sm font-bold text-foreground">4.9/5</span>
                <span className="text-sm text-muted-foreground">from 2,400+ customers</span>
              </div>
            </motion.div>

            <motion.div {...fadeUpView(0.1)} className="grid grid-cols-2 gap-4">
              {a.stats.map((stat, i) => (
                <div key={i} className={`rounded-2xl p-8 text-center border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  i === 0 ? "bg-primary text-white border-primary shadow-[0_8px_32px_rgba(16,30,100,0.25)]" : "bg-card border-border"
                }`}>
                  <h3 className={`font-serif text-4xl font-black mb-2 ${i === 0 ? "text-white" : "text-primary"}`}>{stat.value}</h3>
                  <p className={`font-medium text-sm ${i === 0 ? "text-blue-200" : "text-foreground/70"}`}>{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="container relative mx-auto px-4 md:px-6">
          <motion.div {...fadeUpView()} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">Our Values</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{a.valuesTitle}</h2>
            <p className="text-lg text-muted-foreground max-w-[560px] mx-auto">{a.valuesDesc}</p>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {a.values.map((val, i) => {
              const Icon = valueIcons[i];
              return (
                <motion.div key={i} {...fadeUpView(i * 0.09)}
                  className="group rounded-2xl bg-card border border-border p-7 hover:border-primary/30 hover:shadow-[0_12px_32px_rgba(16,30,100,0.09)] transition-all duration-300">
                  <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 group-hover:text-white ${valueColors[i]}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust items */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <motion.div {...fadeUpView()} className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/15 to-indigo-600/10 blur-2xl" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(16,30,54,0.16)] ring-1 ring-black/5">
                <img src="/manus-storage/service-house-removals_7c8460fa.png" alt="Our professional team" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </motion.div>

            <motion.div {...fadeUpView(0.1)}>
              <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">Why Trust Us</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">{a.trustTitle}</h2>
              <ul className="space-y-6">
                {a.trustItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 group">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary transition-colors duration-300">
                      <CheckCircle2 className="h-5 w-5 text-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link href="/contact">
                  <Button size="lg" className="btn-shine rounded-full px-8 h-12 shadow-lg" data-testid="button-contact-team">
                    {a.contactBtn} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
