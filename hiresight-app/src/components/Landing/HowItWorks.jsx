"use client";

import React from "react";
import { UploadCloud, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: UploadCloud,
    title: "Upload CV",
    desc: "Drop your PDF or Docx file here.",
    color: "group-hover:bg-primary",
  },
  {
    icon: BarChart3,
    title: "Analysis",
    desc: "AI scans for keywords and formatting.",
    color: "group-hover:bg-secondary",
  },
  {
    icon: CheckCircle2,
    title: "Suggestions",
    desc: "Get the perfect resume ready.",
    color: "group-hover:bg-success",
  },
];

const HowItWorks = () => {
  // Variabel untuk kontainer utama
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3, // Jeda antar langkah
      },
    },
  };

  // Variabel untuk setiap item langkah
  const stepVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="py-24 px-6 font-montserrat">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-neutral text-neutral-content rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl"
        >
          {/* Efek Cahaya Dekoratif di Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>

          <div className="text-center mb-16 relative z-10 space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold tracking-tight italic"
            >
              How It Works
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-3 text-accent font-semibold overflow-x-auto whitespace-nowrap pb-2"
            >
              <span className="bg-accent/20 px-3 py-1 rounded-md text-sm">
                1. Upload
              </span>
              <ArrowRight size={16} />
              <span className="bg-accent/20 px-3 py-1 rounded-md text-sm">
                2. Analyze
              </span>
              <ArrowRight size={16} />
              <span className="bg-accent/20 px-3 py-1 rounded-md text-sm">
                3. Improve
              </span>
            </motion.div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-12 relative z-10"
          >
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                variants={stepVariants}
                className="text-center group space-y-4"
              >
                <div
                  className={`mb-4 inline-flex p-6 rounded-full bg-base-100/10 border border-white/10 ${step.color} group-hover:text-white group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-500 shadow-xl`}
                >
                  <step.icon size={36} />
                </div>
                <h4 className="text-2xl font-bold group-hover:text-accent transition-colors">
                  {step.title}
                </h4>
                <p className="text-neutral-content/70 leading-relaxed max-w-[250px] mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
