import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { LanguageProvider } from "@/contexts/language-context";
import { useFirebaseTracking } from "@/hooks/useFirebaseTracking";

import Home from "@/pages/home";
import About from "@/pages/about";
import Services from "@/pages/services";
import Pricing from "@/pages/pricing";
import Book from "@/pages/book";
import Contact from "@/pages/contact";

const pageVariants = {
  initial: { opacity: 0, y: 14, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(2px)" },
};
const pageTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

function AnimatedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <Component />
    </motion.div>
  );
}

// Initialises presence tracking the moment any page loads.
// Must be inside the React tree so the hook can run.
function VisitorPresenceInit() {
  useFirebaseTracking();
  return null;
}

function Router() {
  const [location] = useLocation();
  return (
    <>
      <VisitorPresenceInit />
      <Layout>
        <AnimatePresence mode="wait">
          <Switch key={location} location={location}>
            <Route path="/" component={() => <AnimatedRoute component={Home} />} />
            <Route path="/about" component={() => <AnimatedRoute component={About} />} />
            <Route path="/services" component={() => <AnimatedRoute component={Services} />} />
            <Route path="/pricing" component={() => <AnimatedRoute component={Pricing} />} />
            <Route path="/book" component={() => <AnimatedRoute component={Book} />} />
            <Route path="/contact" component={() => <AnimatedRoute component={Contact} />} />
            <Route component={() => <AnimatedRoute component={NotFound} />} />
          </Switch>
        </AnimatePresence>
      </Layout>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <TooltipProvider>
        <LanguageProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </LanguageProvider>
      </TooltipProvider>
    </HelmetProvider>
  );
}

export default App;
