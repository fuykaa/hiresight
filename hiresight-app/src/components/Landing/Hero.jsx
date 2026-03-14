"use client";
import React from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const blobVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 0.2,
      scale: 1,
      transition: {
        duration: 1.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 dark:opacity-10"
        variants={blobVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-accent blur-[120px] rounded-full"></div>
      </motion.div>

      <motion.div
        className="max-w-5xl mx-auto text-center space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Badge
            variant="outline"
            className="border-primary/50 text-primary px-4 py-1"
          >
            AI-Powered Analysis
          </Badge>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
          variants={itemVariants}
        >
          Improve Your Resume with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            AI ATS Checker
          </span>
        </motion.h1>

        <motion.p
          className="text-xl text-foreground max-w-2xl mx-auto leading-relaxed"
          variants={itemVariants}
        >
          Analyze your resume and optimize it for ATS systems. Get higher
          interview rates with data-driven insights.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          variants={itemVariants}
        >
          <Button
            size="lg"
            className="rounded-2xl px-10 h-14 text-lg font-bold group hover:bg-accent duration-300 shadow-lg shadow-primary/20 group active:scale-95 transition-transform"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5  transition-transform" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
