"use client";

import React, { useEffect, useState } from "react";
import NavButton from "./NavButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  User,
  LayoutDashboard,
  FileText,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const pathname = usePathname();

  const [isDark, setIsDark] = useState(false);

  // Inisialisasi tema saat mount
  useEffect(() => {
    const root = window.document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  const toggleTheme = (theme) => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    }
  };
  return (
    <nav className="fixed z-50 top-6 inset-x-0 mx-auto w-[92%] md:inset-x-1/4 md:w-auto bg-base-100/40 text-base-content py-2.5 px-6 flex items-center justify-between rounded-xl border border-accent-content/30 drop-shadow-lg backdrop-blur-md">
      {/* --- MOBILE VERSION --- */}
      <div className="flex md:hidden w-full items-center justify-between">
        {/* Kiri: Profile Icon Link */}
        <Link
          href="/profile"
          className="p-2 hover:bg-base-content/5 rounded-full transition-colors"
        >
          <User className="w-6 h-6 text-base-content/70" />
        </Link>

        {/* Tengah: Logo */}
        <Link href="/">
          <p className="font-montserrat font-bold text-lg tracking-tighter">
            LOGO
          </p>
        </Link>

        {/* Kanan: Hamburger Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-base-content/5"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-base-100 border-l-border w-full flex flex-col pt-16"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu Navigasi</SheetTitle>
              <SheetDescription>
                Akses cepat ke profil, dashboard, dan resume.
              </SheetDescription>
            </SheetHeader>
            {/* Header Profile (Sesuai Layout Gambar) */}
            <div className="flex items-center gap-4 px-2 mb-8 pb-8 border-b border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="text-primary w-6 h-6" />
              </div>
              <div className="flex flex-col text-left">
                <p className="font-bold text-lg leading-none">Profile</p>
                <Link
                  href="/profile"
                  className="text-sm text-primary mt-1 hover:underline"
                >
                  Lihat dan sunting profil
                </Link>
              </div>
            </div>

            {/* Menu List: Dashboard & Resume (Sesuai Layout Gambar) */}
            <div className="flex flex-col uppercase font-semibold tracking-widest text-center">
              <Link
                href="/dashboard"
                className="py-6 border-b border-border hover:bg-muted/50 transition-all flex items-center justify-center gap-3"
              >
                <LayoutDashboard className="w-5 h-5 opacity-70" />
                Dashboard
              </Link>
              <Link
                href="/resume"
                className="py-6 border-b border-border hover:bg-muted/50 transition-all flex items-center justify-center gap-3"
              >
                <FileText className="w-5 h-5 opacity-70" />
                Resume
              </Link>
            </div>

            {/* Footer Button: Log In (Sesuai Layout Gambar) */}
            <div className="mt-auto flex justify-center pb-6">
              <Button className="w-5/6 h-14 rounded-2xl bg-neutral text-neutral-content font-bold text-lg hover:opacity-90 transition-opacity">
                Log In
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* --- DESKTOP VERSION --- */}
      <div className="hidden md:flex w-full items-center justify-between gap-8">
        {/* Logo Section */}
        <Link href="/">
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <span className="text-primary-content font-black text-xs">L</span>
            </div>
            <p className="font-montserrat font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
              LOGO
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex w-full justify-evenly items-center p-1 rounded-xl border border-base-content/5">
          <NavButton
            text="Dashboard"
            href="/dashboard"
            active={pathname === "/dashboard"}
          />
          <NavButton
            text="Resume"
            href="/resume"
            active={pathname === "/resume"}
          />
        </div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-base-content/5 transition-all outline-none group">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold leading-none">Alex Doe</p>
              </div>
              <Avatar className="w-8 h-8 border border-primary/20 group-hover:border-primary transition-colors">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <ChevronDown
                size={14}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 mt-4 rounded-xl p-2 bg-base-100/90 backdrop-blur-lg"
          >
            <DropdownMenuLabel className="font-montserrat">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg cursor-pointer py-2.5">
              <Link href="/profile" className="flex w-full items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground pt-2 px-2">
              Appearance
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => toggleTheme(isDark ? "light" : "dark")}
              className="rounded-lg cursor-pointer py-2.5 flex justify-between items-center"
            >
              <div className="flex items-center">
                {isDark ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Sun className="mr-2 h-4 w-4" />
                )}
                <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full relative transition-colors  ${isDark ? "bg-primary" : "bg-white"}`}
              >
                <div
                  className={`absolute top-1 w-2 h-2 rounded-full bg-base-content transition-all ${isDark ? "right-1" : "left-1"}`}
                />
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg cursor-pointer py-2.5 text-error hover:bg-error/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
