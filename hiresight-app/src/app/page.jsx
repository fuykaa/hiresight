"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Hero from "@/components/Landing/Hero";
import Features from "@/components/Landing/Features";
import HowItWorks from "@/components/Landing/HowItWorks";
import Footer from "@/components/Footer/Footer";

export default function LandingPage() {
  const router = useRouter();

  // Jika sudah login (cookie ada), middleware akan handle redirect ke /dashboard
  // useEffect ini sebagai fallback jika middleware tidak menangkap
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </main>
  );
}
