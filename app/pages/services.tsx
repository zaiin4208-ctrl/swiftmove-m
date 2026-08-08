import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Home, Truck, Sparkles, Key, Clock, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";

const serviceIcons = [Home, Truck, Sparkles, Key, Clock, Briefcase];
const serviceImages = [
  "/manus-storage/service-house-removals_7c8460fa.png",
  "/manus-storage/service-furniture-moving_0cc20f99.png",
  "/manus-storage/service-cleaning_17b91903.png",
  "/manus-storage/service-end-of-tenancy_238dd391.png",
  "/manus-storage/service-same-day_77b0b97d.png",
  "/manus-storage/service-business-delivery_c2c57083.png",
];
const serviceAccents = [
  "from-blue-500/20 to-indigo-600/10",
  "from-purple-500/20 to-violet-600/10",
  "from-emerald-500/20 to-teal-600/10",
  "from-orange-500/20 to-amber-600/10",
  "from-red-500/20 to-rose-600/10",
  "from-cyan-500/20 to-sky-600/10",
];
const iconColors = [
  "bg-blue-50 text-blue-600",
  "bg-purple-50 text-purple-600",
  "bg-emerald-50 text-emerald-600",
  "bg-orange-50 text-orange-600",
  "bg-red-50 text-red-600",
  "bg-cyan-50 text-cyan-600",
];

export default function Services() {
  const { t, lang } = useLanguage();
  const s = t.services;
  const isAr = lang === "ar";

  return (
    <>
      <Helmet>
        <title>Our Services | House Removals & Cleaning | SwiftMove & Clean</title>
        <meta name="description" content="Explore our comprehensive range of home services including house removals, furniture moving, end of tenancy cleaning, and same-day delivery." />
      </Helmet>

      {/* Hero */}
      <section className="hero-mesh relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="container relative mx-auto px-4 md:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">What We Do</p>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">{s.title}</h1>
            <p className="max-w-[620px] mx-auto text-lg text-white/60">{s.desc}</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-14 md:h-18" preserveAspectRatio="none">
            <path d="M0 70L1440 70L1440 20C1200 70 720 0 0 40L0 70Z" fill="hsl(210,30%,98%)" />
          </svg>
        </div>
      </section>

      {/* Services list */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="space-y-20 md:space-y-28">
            {s.items.map((service, index) => {
              const isEven = index % 2 === 0;
              const Icon = serviceIcons[index];
              return (
                <motion.div key={index}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                  className={`flex flex-col gap-12 lg:gap-20 ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center`}>

                  {/* Image */}
                  <div className="w-full lg:w-1/2">
                    <div className="relative group">
                      <div className={`absolute -inset-3 rounded-3xl bg-gradient-to-br ${serviceAccents[index]} blur-xl opacity-70 group-hover:opacity-90 transition-opacity`} />
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(16,30,54,0.15)] ring-1 ring-black/5">
                        <img src={serviceImages[index]} alt={service.title} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                      {/* Number badge */}
                      <div className="absolute -bottom-4 -right-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white font-serif text-2xl font-black shadow-[0_8px_24px_rgba(16,30,100,0.3)]">
                        {index + 1}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="w-full lg:w-1/2 space-y-6">
                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${iconColors[index]}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">{service.title}</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">{service.description}</p>

                    <div className="pt-2">
                      <h3 className="font-bold text-base mb-4 text-foreground/80 uppercase tracking-wide text-xs">{s.benefits}</h3>
                      <ul className="grid sm:grid-cols-2 gap-3">
                        {service.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-2.5">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground/75">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4">
                      <Link href="/book">
                        <Button size="lg" className="btn-shine rounded-full px-8 h-12 shadow-lg" data-testid={`button-book-service-${index}`}>
                          {s.bookBtn}
                          <ArrowRight className={`h-4 w-4 ${isAr ? "mr-2 rotate-180" : "ml-2"}`} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="hero-mesh relative overflow-hidden py-20">
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-indigo-900/80" />
        <div className="container relative mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">{s.needSomething}</h2>
            <p className="text-lg text-white/60 mb-8 max-w-[560px] mx-auto">{s.needDesc}</p>
            <Link href="/contact">
              <Button size="lg" className="btn-shine bg-white text-primary font-bold rounded-full h-13 px-10 shadow-2xl hover:bg-blue-50 text-base" data-testid="button-services-contact">
                {s.contactBtn} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
