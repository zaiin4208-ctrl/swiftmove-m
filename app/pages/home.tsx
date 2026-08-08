import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Star, Truck, Clock, ShieldCheck, Users, Phone, RefreshCw, Zap, Search, Building2, Home as HomeIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";

const fadeUpView = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const pressLogos = [
  { name: "The Times",    style: "font-serif font-bold text-lg tracking-tight" },
  { name: "The Guardian", style: "font-serif italic text-lg" },
  { name: "Daily Mail",   style: "font-sans font-black text-base uppercase tracking-wide" },
  { name: "Which?",       style: "font-bold text-base" },
];

const whyIcons = [Zap, RefreshCw, Users, ShieldCheck];

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;

export default function Home() {
  const { t, lang } = useLanguage();
  const h = t.home;
  const isAr = lang === "ar";
  const [, navigate] = useLocation();

  const [postcode, setPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState("");

  function handleFind(e: React.FormEvent) {
    e.preventDefault();
    if (!postcode.trim()) { setPostcodeError("Please enter your postcode"); return; }
    if (!UK_POSTCODE_RE.test(postcode.trim())) { setPostcodeError("Please enter a valid UK postcode (e.g. SW1A 1AA)"); return; }
    setPostcodeError("");
    navigate(`/book?postcode=${encodeURIComponent(postcode.trim().toUpperCase())}`);
  }

  const [serviceTab, setServiceTab] = useState<"residential" | "business">("residential");

  const stats = [
    { value: "4.9★", label: "Customer Rating" },
    { value: "2,400+", label: "Moves Completed" },
    { value: "20 min", label: "Avg Arrival" },
    { value: "100%", label: "Fully Insured" },
  ];

  const residentialServices = [
    { icon: "🚚", name: isAr ? "نقل المنازل" : "House Removals", deal: true },
    { icon: "🧹", name: isAr ? "تنظيف نهاية الإيجار" : "End of Tenancy Clean", deal: false },
    { icon: "📦", name: isAr ? "خدمة التغليف" : "Packing Service", deal: false },
    { icon: "🏪", name: isAr ? "التخزين الآمن" : "Secure Storage", deal: false },
    { icon: "🛋️", name: isAr ? "تركيب الأثاث" : "Furniture Assembly", deal: false },
    { icon: "🧽", name: isAr ? "التنظيف العميق" : "Deep Cleaning", deal: true },
    { icon: "🎨", name: isAr ? "تنظيف ما بعد الانتقال" : "Post-Move Clean", deal: false },
    { icon: "🚐", name: isAr ? "خدمة رجل وشاحنة" : "Man & Van", deal: false },
    { icon: "🏠", name: isAr ? "نقل استوديو" : "Studio Moves", deal: false },
    { icon: "🎹", name: isAr ? "نقل البيانو والتحف" : "Piano & Antiques", deal: false },
    { icon: "♻️", name: isAr ? "إخلاء المنزل" : "House Clearance", deal: true },
    { icon: "📷", name: isAr ? "جرد الممتلكات" : "Inventory Service", deal: false },
  ];

  const businessServices = [
    { icon: "🏢", name: isAr ? "نقل المكاتب" : "Office Removals", deal: true },
    { icon: "🗄️", name: isAr ? "تغليف مستلزمات المكتب" : "Office Packing", deal: false },
    { icon: "🧹", name: isAr ? "التنظيف التجاري" : "Commercial Cleaning", deal: false },
    { icon: "📦", name: isAr ? "تخزين الوثائق" : "Document Storage", deal: false },
    { icon: "💻", name: isAr ? "نقل معدات IT" : "IT Equipment Moving", deal: true },
    { icon: "🏗️", name: isAr ? "إخلاء المستودعات" : "Warehouse Clearance", deal: false },
    { icon: "🚚", name: isAr ? "خدمة الأسطول" : "Fleet Removals", deal: false },
    { icon: "🔒", name: isAr ? "خدمة التمزيق الآمن" : "Secure Shredding", deal: false },
    { icon: "🛋️", name: isAr ? "تأثيث المكاتب" : "Office Fit-Out", deal: false },
    { icon: "📱", name: isAr ? "نقل معارض البيع" : "Showroom Moves", deal: true },
    { icon: "🏥", name: isAr ? "نقل المرافق الطبية" : "Medical Facilities", deal: false },
    { icon: "🍽️", name: isAr ? "نقل المطاعم" : "Restaurant Relocations", deal: false },
  ];

  return (
    <>
      <Helmet>
        <title>House Removals UK — Team in 20 Minutes | SwiftMove & Clean</title>
        <meta name="description" content="Professional UK house removals. Pay online and your team arrives within 20 minutes. Competitive prices from £299. Fully insured, no hidden fees." />
      </Helmet>

      {/* ═══ FULL-SCREEN HERO — Housekeep style ═══ */}
      <section className="relative min-h-[100svh] flex flex-col">
        {/* Full-bleed background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/manus-storage/service-house-removals_7c8460fa.png"
            alt="Professional house removal team"
            className="h-full w-full object-cover object-center"
          />
          {/* Left gradient so text is readable; right stays transparent (photo visible) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 items-center">
          <div className="container mx-auto px-6 md:px-10 pt-28 pb-20 md:pt-40 md:pb-28">
            <div className="max-w-[600px]">

              {/* Trustpilot row — exactly like Housekeep */}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                className="mb-5 flex items-center gap-2"
              >
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-[#00b67a] text-[#00b67a]" />)}
                </div>
                <span className="text-sm font-bold text-white">Excellent</span>
                <span className="text-white/50 text-sm">·</span>
                <span className="text-sm text-white/70">Trustpilot</span>
              </motion.div>

              {/* BIG italic headline — Housekeep style */}
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] as const }}
                className="font-serif italic font-bold text-white leading-[1.05] mb-5"
                style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)" }}
              >
                {h.hero1}<br />{h.hero2}
              </motion.h1>

              {/* Subtitle — 3 short lines like Housekeep */}
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
                className="text-white/75 text-lg leading-snug mb-8 space-y-0.5"
              >
                <p>Professional movers. Vetted & insured teams.</p>
                <p>Pay online and your team is at your door.</p>
                <p>This is housemoving that works.</p>
              </motion.div>

              {/* Postcode search bar — Housekeep style */}
              <motion.form
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
                onSubmit={handleFind}
                className="mb-3"
              >
                <div className="flex items-stretch rounded-xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.35)] max-w-[500px]">
                  <div className="flex items-center gap-2 bg-white px-4 flex-1 min-w-0">
                    <Search className="h-5 w-5 text-gray-400 shrink-0" />
                    <input
                      value={postcode}
                      onChange={e => { setPostcode(e.target.value.toUpperCase()); setPostcodeError(""); }}
                      placeholder="Enter your postcode"
                      maxLength={8}
                      className="flex-1 py-4 text-base font-mono font-semibold tracking-wider text-gray-800 outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400 placeholder:font-normal uppercase bg-transparent"
                      data-testid="input-hero-postcode"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-4 text-base transition-colors whitespace-nowrap shrink-0"
                    data-testid="button-hero-find"
                  >
                    {lang === "ar" ? "ابحث" : "Book your move"}
                  </button>
                </div>
                {postcodeError && (
                  <p className="mt-2 text-sm text-red-300 font-medium">{postcodeError}</p>
                )}
              </motion.form>

              {/* Trust micro-chips */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }}
                className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/65"
              >
                {[
                  { icon: ShieldCheck, label: h.fullyInsured },
                  { icon: Clock,       label: h.dispatch },
                  { icon: CheckCircle2,label: h.noFees },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-white/50" />
                    {label}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Floating "Team dispatched" card — bottom right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="absolute bottom-8 right-8 z-10 hidden md:flex items-center gap-3 rounded-2xl glass-card px-4 py-3 shadow-2xl"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/20">
            <Truck className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{h.teamDispatched}</div>
            <div className="flex items-center gap-1.5 text-xs text-white/55">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 pulse-gentle" />
              {h.arriving}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ PRESS / TRUST BAR — exactly like Housekeep ═══ */}
      <section className="bg-white border-b border-border/60">
        <div className="container mx-auto px-6 md:px-10 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">We've been featured in</p>
            <div className="h-5 w-px bg-border hidden sm:block" />
            {pressLogos.map(({ name, style }) => (
              <span key={name} className={`${style} text-foreground/35 whitespace-nowrap select-none`}>{name}</span>
            ))}
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-[#00b67a] text-[#00b67a]" />)}
              <span className="text-xs font-bold text-[#00b67a]">Excellent on Trustpilot</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST BADGES ═══ */}
      <section className="bg-background border-b border-border/50 py-8">
        <div className="container mx-auto px-6 md:px-10">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              { icon: "🛡️", title: "Fully Licensed", sub: "Registered in the UK" },
              { icon: "✅", title: "Fully Insured", sub: "£1M public liability" },
              { icon: "💰", title: "Money-Back Guarantee", sub: "100% satisfaction or refund" },
              { icon: "⭐", title: "5-Star Rated", sub: "2,400+ happy customers" },
              { icon: "🔒", title: "Secure Payments", sub: "Powered by Stripe" },
            ].map((b, i) => (
              <motion.div key={b.title} {...fadeUpView(i * 0.06)}
                className="card-hover flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 shadow-sm">
                <span className="text-2xl shrink-0">{b.icon}</span>
                <div>
                  <div className="font-bold text-sm text-foreground">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES GRID — Fantastic Services style ═══ */}
      <section className="bg-white py-16 md:py-20 border-b border-border/50">
        <div className="container mx-auto px-6 md:px-10">

          {/* Header + Residential/Business Toggle */}
          <motion.div {...fadeUpView()} className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2">
              {isAr ? "ما نقدمه" : "What We Offer"}
            </p>
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <h2 className="font-serif italic text-3xl md:text-4xl font-bold">
                {isAr ? "اختر نوع خدمتك" : "Services Available in Your Area"}
              </h2>
              <Link href="/services" className="text-sm font-bold text-primary hover:underline underline-offset-2">
                {isAr ? "عرض الكل ←" : "View all services →"}
              </Link>
            </div>

            {/* Tab toggle — exactly like Fantastic's Domestic/Commercial */}
            <div className="inline-flex rounded-xl border border-border bg-secondary p-1 shadow-sm">
              <button
                onClick={() => setServiceTab("residential")}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  serviceTab === "residential"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HomeIcon className="h-4 w-4 shrink-0" />
                {isAr ? "سكني" : "Residential"}
              </button>
              <button
                onClick={() => setServiceTab("business")}
                className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                  serviceTab === "business"
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                {isAr ? "تجاري" : "Business"}
              </button>
            </div>
          </motion.div>

          {/* 4-column icon grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {(serviceTab === "residential" ? residentialServices : businessServices).map((svc, i) => (
              <motion.div
                key={`${serviceTab}-${svc.name}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link href="/book">
                  <div className="relative flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-primary/40 hover:bg-primary/[0.03] hover:shadow-md transition-all duration-200 cursor-pointer group">
                    {svc.deal && (
                      <span className="absolute -top-2 right-3 rounded-full bg-primary text-white text-[10px] font-black px-2 py-0.5 shadow-sm uppercase tracking-wide">
                        {isAr ? "عرض" : "DEAL"}
                      </span>
                    )}
                    <span className="text-2xl shrink-0 leading-none">{svc.icon}</span>
                    <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground leading-snug">{svc.name}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div {...fadeUpView(0.2)} className="text-center mt-8">
            <Link href="/book">
              <Button className="btn-shine rounded-full px-8 font-bold shadow-sm" data-testid="button-services-grid-cta">
                {isAr ? "احجز خدمتك الآن" : "Check Prices & Availability"} <ArrowRight className={`h-4 w-4 ${isAr ? "mr-2 rotate-180" : "ml-2"}`} />
              </Button>
            </Link>
          </motion.div>

          {/* Featured Services — detailed Checkatrade-style cards */}
          <div className="mt-14 border-t border-border/50 pt-12">
            <motion.div {...fadeUpView()} className="mb-7">
              <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">
                {isAr ? "خدماتنا المميزة" : "Featured Services"}
              </p>
              <h3 className="font-serif italic text-2xl font-bold">
                {isAr ? "الأكثر طلباً في منطقتك" : "Most Requested Near You"}
              </h3>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2 max-w-5xl mx-auto">
              {[
                {
                  icon: "🚚",
                  name: isAr ? "نقل البيوت والشقق" : "House & Flat Removals",
                  rating: "9.8", reviews: 847,
                  skills: isAr
                    ? ["نقل كامل للمنزل", "شقق واستوديوهات", "نقل في نفس اليوم", "بيانو وتحف"]
                    : ["Full house moves", "Flat & studio", "Same-day moves", "Piano & antiques"],
                  from: "From £299",
                  available: isAr ? "متاح اليوم" : "Available today",
                  color: "blue",
                },
                {
                  icon: "🧹",
                  name: isAr ? "تنظيف نهاية الإيجار" : "End of Tenancy Cleaning",
                  rating: "9.7", reviews: 612,
                  skills: isAr
                    ? ["تنظيف عميق", "تنظيف السجاد", "الأفران والأجهزة", "معتمد من المالك"]
                    : ["Deep clean", "Carpet cleaning", "Oven & appliances", "Landlord approved"],
                  from: "From £149",
                  available: isAr ? "متاح اليوم" : "Available today",
                  color: "green",
                },
                {
                  icon: "📦",
                  name: isAr ? "خدمة التغليف والتعبئة" : "Professional Packing Service",
                  rating: "9.6", reviews: 389,
                  skills: isAr
                    ? ["تغليف كامل", "مواد هشة", "صناديق مشمولة", "فك التغليف أيضاً"]
                    : ["Full packing", "Fragile items", "Boxes supplied", "Unpacking too"],
                  from: "From £99",
                  available: isAr ? "متاح اليوم" : "Available today",
                  color: "purple",
                },
                {
                  icon: "🏪",
                  name: isAr ? "خدمة التخزين الآمن" : "Secure Storage Solutions",
                  rating: "9.5", reviews: 204,
                  skills: isAr
                    ? ["كاميرات 24/7", "بيئة مضبوطة", "عقود مرنة", "خدمة التوصيل"]
                    : ["24/7 CCTV", "Climate controlled", "Flexible contracts", "Collection available"],
                  from: "From £49/wk",
                  available: isAr ? "أماكن محدودة" : "Limited spaces",
                  color: "amber",
                },
              ].map((svc, i) => {
                const colorMap: Record<string, { badge: string; dot: string; star: string }> = {
                  blue:   { badge: "bg-blue-50 border-blue-200",   dot: "bg-blue-500",   star: "text-blue-500" },
                  green:  { badge: "bg-green-50 border-green-200", dot: "bg-green-500",  star: "text-green-500" },
                  purple: { badge: "bg-purple-50 border-purple-200", dot: "bg-purple-500", star: "text-purple-500" },
                  amber:  { badge: "bg-amber-50 border-amber-200", dot: "bg-amber-500",  star: "text-amber-500" },
                };
                const c = colorMap[svc.color];
                return (
                  <motion.div key={svc.name} {...fadeUpView(i * 0.07)}
                    className="card-hover rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl shadow-sm border border-border">
                        {svc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-bold text-[1.05rem] leading-tight">{svc.name}</h3>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${c.badge}`}>
                            <Star className={`h-3 w-3 fill-current ${c.star}`} />
                            {svc.rating} · {svc.reviews} {isAr ? "تقييم" : "reviews"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 mb-3">
                          <div className={`h-2 w-2 rounded-full ${c.dot} pulse-gentle`} />
                          <span className="text-xs text-muted-foreground font-medium">{svc.available}</span>
                          <span className="text-muted-foreground/40 mx-1">·</span>
                          <span className="text-xs font-bold text-primary">{svc.from}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {svc.skills.map(skill => (
                            <span key={skill} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/70">
                              <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />{skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Link href="/book" className="flex-1">
                            <Button size="sm" className="w-full rounded-full font-bold" data-testid={`button-service-book-${i}`}>
                              {isAr ? "احجز الآن" : "Request a quote"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <a href="tel:+19482232328">
                            <Button size="sm" variant="outline" className="rounded-full border-border font-semibold px-4">
                              <Phone className="h-3.5 w-3.5 mr-1.5" />{isAr ? "اتصل" : "Call"}
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="bg-background py-14 border-b border-border/50">
        <div className="container mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((s, i) => (
              <motion.div key={s.label} {...fadeUpView(i * 0.07)} className="text-center">
                <div className="font-serif italic text-4xl md:text-5xl font-black text-primary mb-1">{s.value}</div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6 md:px-10">
          <motion.div {...fadeUpView()} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">{h.howTitle}</p>
            <h2 className="font-serif italic text-3xl md:text-4xl font-bold mb-4">{h.howDesc}</h2>
          </motion.div>
          <div className="relative grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {/* Connecting dashed line — desktop only */}
            <div className="absolute hidden md:block top-[27px] left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px border-t-2 border-dashed border-primary/25 z-0" />
            {h.how.map(({ title, desc }, i) => (
              <motion.div key={title} {...fadeUpView(i * 0.1)}
                className="card-hover relative z-10 flex flex-col items-center text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
                {/* Step number with outer ring */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-2xl bg-primary/10 scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[0_6px_20px_rgba(16,30,100,0.25)] text-white font-serif font-black text-2xl ring-4 ring-primary/15">
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div className="absolute -right-[calc(50%+28px)] top-1/2 -translate-y-1/2 hidden md:flex items-center">
                      <ArrowRight className="h-5 w-5 text-primary/30" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
                {i === 0 && (
                  <div className="mt-4 flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 pulse-gentle" />
                    <span className="text-[11px] font-bold text-green-700">{lang === "ar" ? "بدون إنتظار — أسعار فورية" : "No waiting — instant prices"}</span>
                  </div>
                )}
                {i === 1 && (
                  <div className="mt-4 flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[11px] font-bold text-blue-700">{lang === "ar" ? "دفع آمن 100% بـ Stripe" : "100% secure via Stripe"}</span>
                  </div>
                )}
                {i === 2 && (
                  <div className="mt-4 flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1">
                    <Clock className="h-3.5 w-3.5 text-orange-600" />
                    <span className="text-[11px] font-bold text-orange-700">{lang === "ar" ? "فريقك يصل خلال 20 دقيقة" : "Team at door in 20 mins"}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUpView(0.3)} className="text-center mt-12">
            <Link href="/book">
              <Button size="lg" className="btn-shine rounded-full px-10 shadow-md text-base" data-testid="button-how-it-works-cta">
                {h.bookBtn} <ArrowRight className={`h-5 w-5 ${isAr ? "mr-2 rotate-180" : "ml-2"}`} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ PACKAGES ═══ */}
      <section className="py-20 md:py-28 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="container relative mx-auto px-6 md:px-10">
          <motion.div {...fadeUpView()} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">Pricing</p>
            <h2 className="font-serif italic text-3xl md:text-4xl font-bold mb-4">{h.packagesTitle}</h2>
            <p className="text-lg text-muted-foreground max-w-[560px] mx-auto">{h.packagesDesc}</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 max-w-6xl mx-auto">
            {t.packages.map((pkg, i) => (
              <motion.div key={pkg.label} {...fadeUpView(i * 0.07)}
                className={`card-hover group relative flex flex-col rounded-2xl border-2 p-6 text-center ${
                  pkg.popular
                    ? "border-primary bg-primary text-white shadow-[0_8px_32px_rgba(16,30,100,0.25)]"
                    : "border-border bg-card"
                }`}>
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 text-yellow-900 px-4 py-0.5 text-xs font-black whitespace-nowrap shadow-md">
                    {t.mostPopular}
                  </div>
                )}
                <div className="text-4xl mb-3">🏠</div>
                <h3 className={`font-bold text-lg mb-1 ${pkg.popular ? "text-white" : ""}`}>{pkg.label}</h3>
                <p className={`text-xs mb-4 ${pkg.popular ? "text-blue-100" : "text-muted-foreground"}`}>{pkg.team}</p>
                <div className={`font-serif italic text-3xl font-black mb-1 ${pkg.popular ? "text-white" : "text-primary"}`}>{pkg.from}</div>
                <p className={`text-[10px] mb-5 ${pkg.popular ? "text-blue-200" : "text-muted-foreground"}`}>{t.fullMove}</p>
                <Link href="/book" className="mt-auto">
                  <Button size="sm" className={`w-full rounded-full font-bold ${
                    pkg.popular ? "bg-white text-primary hover:bg-blue-50" : "bg-primary/10 text-primary hover:bg-primary hover:text-white border-0"
                  }`} data-testid={`button-home-package-${i}`}>
                    {h.bookNow}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUpView(0.3)} className="text-center mt-10">
            <Link href="/pricing">
              <Button variant="outline" className="rounded-full px-8 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all">
                {h.fullPricing} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-6 md:px-10">
          <motion.div {...fadeUpView()} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">Why Choose Us</p>
            <h2 className="font-serif italic text-3xl md:text-4xl font-bold mb-4">{h.whyTitle}</h2>
            <p className="text-lg text-muted-foreground">{h.whyDesc}</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {h.why.map(({ title, desc }, i) => {
              const Icon = whyIcons[i];
              return (
                <motion.div key={title} {...fadeUpView(i * 0.09)}
                  className="card-hover group rounded-2xl border border-border bg-card p-7">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section className="py-20 md:py-28 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="container relative mx-auto px-6 md:px-10">
          <motion.div {...fadeUpView()} className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">Testimonials</p>
            <h2 className="font-serif italic text-3xl md:text-4xl font-bold mb-3">{h.reviewsTitle}</h2>
            <div className="flex justify-center items-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => <Star key={s} className="h-5 w-5 fill-[#00b67a] text-[#00b67a]" />)}
            </div>
            <p className="text-muted-foreground font-medium">{h.reviewsDesc}</p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {h.reviews.map((review, i) => (
              <motion.div key={review.name} {...fadeUpView(i * 0.1)}
                className="card-hover rounded-2xl bg-card border border-border p-7 shadow-sm flex flex-col">
                <div className="flex mb-4">{[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-[#00b67a] text-[#00b67a]" />)}</div>
                <p className="text-foreground/75 leading-relaxed flex-1 mb-5 text-[0.95rem]">"{review.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-sm shadow-md">{review.name[0]}</div>
                  <div>
                    <div className="font-bold text-sm">{review.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{review.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SPECIAL OFFERS ═══ */}
      <section className="py-20 md:py-28 bg-background border-t border-border/50">
        <div className="container mx-auto px-6 md:px-10">
          <motion.div {...fadeUpView()} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 text-orange-700 px-4 py-1.5 text-xs font-black uppercase tracking-wide mb-4">
              🔥 Limited Time Offers
            </span>
            <h2 className="font-serif italic text-3xl md:text-4xl font-bold mb-3">
              {lang === "ar" ? "عروض خاصة هذا الأسبوع" : "This Week's Special Deals"}
            </h2>
            <p className="text-muted-foreground text-lg">
              {lang === "ar" ? "احجز الآن واستفد من هذه الأسعار الحصرية" : "Book now and lock in these exclusive prices before they expire"}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                badge: "🌅 Early Bird",
                badgeColor: "bg-blue-100 text-blue-700",
                title: lang === "ar" ? "خصم الحجز المبكر" : "Early Bird Discount",
                desc: lang === "ar" ? "احجز قبل 48 ساعة ووفّر 10% على أي حزمة" : "Book 48 hours in advance and save 10% on any package",
                saving: "Save 10%",
                savingColor: "bg-blue-600",
                cta: lang === "ar" ? "احجز الآن" : "Book Now",
                accent: "border-blue-200 hover:border-blue-400",
              },
              {
                badge: "⚡ Flash Deal",
                badgeColor: "bg-orange-100 text-orange-700",
                title: lang === "ar" ? "عرض الأسبوع" : "This Week Only",
                desc: lang === "ar" ? "غرفتان أو ثلاث — وفّر 15% هذا الأسبوع فقط!" : "2 or 3-bed move this week — get 15% off, limited slots!",
                saving: "Save 15%",
                savingColor: "bg-orange-500",
                cta: lang === "ar" ? "استغل العرض" : "Claim Deal",
                accent: "border-orange-200 hover:border-orange-400",
                popular: true,
              },
              {
                badge: "🎓 Student Deal",
                badgeColor: "bg-purple-100 text-purple-700",
                title: lang === "ar" ? "خصم الطلاب" : "Student Move Special",
                desc: lang === "ar" ? "خصم 12% لطلاب الجامعات — استوديو وغرفة واحدة فقط" : "12% off for university students — Studio & 1-bed only",
                saving: "Save 12%",
                savingColor: "bg-purple-600",
                cta: lang === "ar" ? "احجز بخصم" : "Get Student Rate",
                accent: "border-purple-200 hover:border-purple-400",
              },
            ].map((offer, i) => (
              <motion.div key={offer.title} {...fadeUpView(i * 0.1)}
                className={`card-hover relative rounded-2xl border-2 bg-card p-7 shadow-sm ${offer.accent}`}>
                {offer.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 text-white px-4 py-0.5 text-xs font-black whitespace-nowrap shadow-md">
                    Most Popular
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${offer.badgeColor}`}>{offer.badge}</span>
                  <span className={`${offer.savingColor} text-white rounded-full px-3 py-1 text-xs font-black`}>{offer.saving}</span>
                </div>
                <h3 className="font-bold text-xl mb-2">{offer.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{offer.desc}</p>
                <Link href="/book">
                  <Button className="w-full rounded-full font-bold" data-testid={`button-offer-${i}`}>
                    {offer.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p {...fadeUpView(0.3)} className="text-center text-xs text-muted-foreground mt-8">
            * Offers valid for bookings made this week only. Cannot be combined with other discounts.
          </motion.p>
        </div>
      </section>

      {/* ═══ CTA BANNER ═══ */}
      <section className="hero-mesh relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-indigo-900/80" />
        <div className="container relative mx-auto px-6 md:px-10 text-center">
          <motion.div {...fadeUpView()}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
              <Truck className="h-10 w-10 text-white" />
            </div>
            <h2 className="font-serif italic text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">{h.ctaTitle}</h2>
            <p className="max-w-[460px] mx-auto text-white/60 mb-10 text-lg">{h.ctaDesc}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book">
                <Button size="lg" className="btn-shine bg-white text-primary font-bold rounded-full h-14 px-10 shadow-2xl hover:bg-blue-50 text-base" data-testid="button-footer-cta">
                  {h.ctaBtn} <ArrowRight className={`h-5 w-5 ${isAr ? "mr-2 rotate-180" : "ml-2"}`} />
                </Button>
              </Link>
              <a href="tel:+19482232328">
                <Button size="lg" variant="outline" className="rounded-full h-14 px-10 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-base">
                  <Phone className="mr-2 h-5 w-5" />{h.callBtn}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
