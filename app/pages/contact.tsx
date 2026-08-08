import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, Phone, Mail, Clock, MessageCircle, ArrowRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Contact() {
  const { t } = useLanguage();
  const c = t.contact;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    service: z.string().min(1),
    message: z.string().min(10),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", service: "", message: "" },
  });

  const createContact = trpc.contacts.create.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Message sent successfully!");
    },
    onError: (err) => {
      toast.error("Sorry, something went wrong. Please call us directly on +1 948 223 2328.");
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await createContact.mutateAsync({
        name: values.name,
        email: values.email,
        subject: values.service,
        message: values.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const contactCards = [
    {
      icon: Phone,
      label: c.callUs,
      value: "+1 948 223 2328",
      link: "tel:+19482232328",
      color: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
    },
    {
      icon: Mail,
      label: c.email,
      value: "helloswiftmoveandclean.co.uk@cutsup.com",
      link: "mailto:helloswiftmoveandclean.co.uk@cutsup.com",
      color: "bg-purple-50 text-purple-600",
      dotColor: "bg-purple-500",
    },
    {
      icon: Clock,
      label: c.hours,
      value: c.hoursLines[0],
      link: null,
      color: "bg-orange-50 text-orange-600",
      dotColor: "bg-orange-500",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us | SwiftMove & Clean</title>
        <meta name="description" content="Get in touch with SwiftMove & Clean for enquiries, support, or direct bookings." />
      </Helmet>

      {/* Hero */}
      <section className="hero-mesh relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 dot-grid opacity-25" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="container relative mx-auto px-4 md:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">Get In Touch</p>
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">{c.title}</h1>
            <p className="max-w-[580px] mx-auto text-lg text-white/60">{c.desc}</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-14 md:h-18" preserveAspectRatio="none">
            <path d="M0 70L1440 70L1440 20C1200 70 720 0 0 40L0 70Z" fill="hsl(210,30%,98%)" />
          </svg>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 bg-background border-b border-border/60">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {contactCards.map(({ icon: Icon, label, value, link, color, dotColor }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
              >
                {link ? (
                  <a href={link} className="group flex flex-col rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(16,30,54,0.09)] transition-all duration-300">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{value}</p>
                  </a>
                ) : (
                  <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                    <p className="font-bold text-foreground">{value}</p>
                    {c.hoursLines[1] && <p className="text-sm text-muted-foreground mt-1">{c.hoursLines[1]}</p>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 max-w-6xl mx-auto items-start">

            {/* Info side */}
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }} className="space-y-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-3">Contact Info</p>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">{c.infoTitle}</h2>
                <p className="text-muted-foreground leading-relaxed">{c.infoDesc}</p>
              </div>

              <div className="space-y-5">
                {contactCards.map(({ icon: Icon, label, value, link, color }) => (
                  <div key={label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{label}</p>
                      {link ? (
                        <a href={link} className="font-bold text-foreground hover:text-primary transition-colors">{value}</a>
                      ) : (
                        <p className="font-bold text-foreground">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live status */}
              <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5 flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse shrink-0" />
                <div>
                  <p className="font-bold text-sm">Team is online now</p>
                  <p className="text-xs text-muted-foreground">Average response time: under 5 minutes</p>
                </div>
              </div>
            </motion.div>

            {/* Form side */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }}>
              <div className="rounded-2xl border border-border bg-card p-7 md:p-10 shadow-[0_8px_32px_rgba(16,30,54,0.08)]">
                <h2 className="font-serif text-2xl font-bold mb-7">{c.formTitle}</h2>
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-[0_8px_24px_rgba(16,30,100,0.25)] text-white">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{c.successTitle}</h3>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-[280px]">{c.successDesc}</p>
                    <Button onClick={() => { setIsSuccess(false); form.reset(); }} variant="outline" className="rounded-full px-8">
                      {c.sendAnother}
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>{c.nameLabel}</FormLabel><FormControl><Input placeholder={c.namePlaceholder} {...field} data-testid="contact-input-name" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>{c.emailLabel}</FormLabel><FormControl><Input type="email" placeholder={c.emailPlaceholder} {...field} data-testid="contact-input-email" /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="service" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{c.enquiryLabel}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger data-testid="contact-select-type"><SelectValue placeholder={c.enquiryPlaceholder} /></SelectTrigger></FormControl>
                            <SelectContent>
                              {c.enquiryTypes.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem><FormLabel>{c.messageLabel}</FormLabel><FormControl><Textarea placeholder={c.messagePlaceholder} className="min-h-[130px]" {...field} data-testid="contact-input-message" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="submit" className="btn-shine w-full h-12 rounded-full font-bold shadow-md text-base" disabled={isSubmitting} data-testid="button-submit-contact">
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{c.sending}</>
                        ) : (
                          <><Send className="mr-2 h-4 w-4" />{c.sendBtn}</>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ MAP ═══ */}
      <section className="bg-secondary border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6 py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 text-center">Service Area</p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-center mb-8">We Cover All Across the UK</h2>
            <div className="rounded-2xl overflow-hidden border border-border shadow-[0_8px_32px_rgba(16,30,54,0.1)] max-w-5xl mx-auto">
              <iframe
                title="SwiftMove & Clean Service Area"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.5904828946547!2d-0.12775842346114327!3d51.50732097181578!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487604b900d26973%3A0x4291f3172409ea92!2sLondon%2C%20UK!5e0!3m2!1sen!2suk!4v1715000000000!5m2!1sen!2suk"
                width="100%"
                height="420"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              📍 Based in London — serving all major UK cities
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
