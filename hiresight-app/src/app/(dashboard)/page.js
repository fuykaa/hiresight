import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat md:pt-20">
      <Hero />
      <Features />
      <HowItWorks />
    </div>
  );
};

export default LandingPage;
