"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

// Import komponen shadcn dari folder ui kamu
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login, loading, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(formData);
      if (response) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Back Button menggunakan shadcn Button variant ghost */}
      <div className="w-full max-w-4xl mb-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 font-bold text-muted-foreground hover:text-primary p-0 h-auto bg-transparent"
        >
          <ArrowLeft
            size={20}
            className="transition-transform group-hover:-translate-x-1"
          />
          Back
        </Button>
      </div>

      {/* Container utama menggunakan shadcn Card */}
      <Card className="flex w-full max-w-4xl overflow-hidden shadow-2xl border-border bg-card">
        <CardContent className="p-0 flex w-full">
          {/* Left Side: Visual Placeholder (Tetap div custom untuk dekorasi) */}
          <div className="hidden md:flex md:w-1/2 bg-muted/50 items-center justify-center p-12 relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(var(--primary) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="z-10 text-center">
              <div className="w-20 h-20 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center -rotate-3">
                <span className="text-primary-foreground text-3xl font-bold">
                  H
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome Back
              </h2>
              <p className="text-muted-foreground text-sm">
                Lanjutkan analisis CV Anda dengan AI Hiresight.
              </p>
            </div>
          </div>

          {/* Right Side: Form area */}
          <div className="w-full md:w-1/2 p-8 md:p-12">
            <div className="max-w-md mx-auto">
              <h1 className="text-3xl font-bold text-foreground mb-2">Login</h1>
              <p className="text-muted-foreground mb-8 text-sm">
                Masuk menggunakan kredensial akun Anda.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email menggunakan shadcn Label & Input */}
                <div className="grid w-full items-center gap-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    suppressHydrationWarning
                    placeholder="name@mail.id"
                    className="bg-muted/30 focus-visible:ring-primary"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Password menggunakan shadcn Label & Input */}
                <div className="grid w-full items-center gap-1.5">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Password
                    </Label>
                    {/* <Link
                      href="/forgot-password"
                      size="sm"
                      className="text-xs text-primary hover:underline"
                    >
                      Lupa Password?
                    </Link> */}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      suppressHydrationWarning
                      placeholder="••••••••"
                      className="bg-muted/30 focus-visible:ring-primary pr-10"
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-primary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Button>
                  </div>
                </div>

                {/* Submit menggunakan shadcn Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-bold shadow-lg shadow-primary/20 h-11"
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </Button>

                {error && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-center">
                    <p className="text-error text-xs font-medium">{error}</p>
                  </div>
                )}
              </form>

              <p className="text-center text-sm text-muted-foreground mt-10">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="text-primary font-bold hover:underline"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
