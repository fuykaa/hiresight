"use client";

import React from "react";
import { BarChart3, Search, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "ATS Analysis",
    description:
      "Score resume automatically based on common industry standards and algorithms.",
    icon: BarChart3,
    color: "primary", // Mapping ke --color-primary
  },
  {
    title: "Keyword Scan",
    description:
      "Find missing keywords from job descriptions to ensure you pass the initial filters.",
    icon: Search,
    color: "secondary", // Mapping ke --color-secondary
  },
  {
    title: "AI Advice",
    description:
      "Receive personalized suggestions to improve your resume content and structure.",
    icon: Lightbulb,
    color: "accent", // Mapping ke --color-accent
  },
];

const Features = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.21, 1.11, 0.81, 0.99],
      },
    },
  };

  return (
    <section className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Powerful Features
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 80 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-1.5 bg-primary mx-auto rounded-full"
          ></motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={cardVariants}>
              <Card
                className={`h-full bg-card border-border hover:border-${feature.color} transition-colors duration-300 shadow-sm group relative overflow-hidden`}
              >
                {/* Subtle Hover Glow Effect */}
                <div
                  className={`absolute -right-4 -top-4 w-24 h-24 bg-${feature.color}/5 rounded-full blur-2xl group-hover:bg-${feature.color}/10 transition-colors`}
                ></div>

                <CardHeader>
                  <div
                    className={`w-14 h-14 bg-accent/10 text-${feature.color} rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
                  >
                    <feature.icon size={28} />
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
