"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Instagram, Mail } from "lucide-react";
import logo from "@/assets/logo.svg";
import logoDark from "@/assets/logo-dark.svg";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    setIsDark(root.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="w-full bg-base-300 border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
          {/* --- SECTION 1: LOGO & DESCRIPTION --- */}
          <div className="space-y-4 max-w-xs flex flex-col justify-center items-center md:justify-start md:items-start text-center md:text-left">
            <Link href="/">
              <div className="flex items-center gap-2 group">
                <Image
                  src={isDark ? logoDark : logo}
                  alt="HireSight Logo"
                  width={32}
                  height={32}
                  priority
                  className="group-hover:rotate-12 transition-transform"
                />
                <p className="font-montserrat font-bold text-xl tracking-tight">
                  HireSight
                </p>
              </div>
            </Link>
            <p className="text-foreground text-sm leading-relaxed">
              Optimalkan resume Anda dengan teknologi AI tercanggih untuk
              menembus sistem ATS perusahaan impian.
            </p>
          </div>

          {/* --- SECTION 2: MENU LINKS --- */}
          <div className="space-y-4 flex flex-col justify-center md:justify-start md:items-start items-center text-center md:text-left">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary">
              Navigasi
            </h4>
            <ul className="space-y-2 text-sm text-foreground">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/resume"
                  className="hover:text-primary transition-colors"
                >
                  Resume
                </Link>
              </li>
            </ul>
          </div>

          {/* --- SECTION 3: SOCIAL MEDIA (3 LOGO) --- */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Link
                href="https://github.com"
                className="p-3 bg-base-200 rounded-xl hover:bg-primary hover:text-primary-content transition-all active:scale-95"
                aria-label="Github"
              >
                <Github size={20} />
              </Link>
              <Link
                href="https://twitter.com"
                className="p-3 bg-base-200 rounded-xl hover:bg-primary hover:text-primary-content transition-all active:scale-95"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </Link>
              <Link
                href="https://instagram.com"
                className="p-3 bg-base-200 rounded-xl hover:bg-primary hover:text-primary-content transition-all active:scale-95"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </Link>
            </div>
            <div className="flex items-center gap-2 text-foreground text-sm justify-start md:justify-end pt-2">
              <Mail size={14} />
              <span>support@hiresight.com</span>
            </div>
          </div>
        </div>

        {/* --- COPYRIGHT SECTION --- */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-foreground font-medium uppercase tracking-tighter">
          <p>© {currentYear} HireSight Inc. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
