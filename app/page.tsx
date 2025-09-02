import Image from "next/image";
import HeroSection from "./components/landing/HeroSection";
import FeaturesSection from "./components/landing/FeaturesSection";
import IntegrationsSection from "./components/landing/IntegrationsSection";
import HowItWorksSection from "./components/landing/HowItWorksSection";
import MoreFeaturesSection from "./components/landing/MoreFeaturesSection";
import CTASection from "./components/landing/CTASection";
import Footer from "./components/landing/Footer";

export default function Home() {
  return (

    <div className="min-h-screen bg-black">
      <HeroSection />
      <FeaturesSection />
      <IntegrationsSection />
      <HowItWorksSection />
      <MoreFeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}