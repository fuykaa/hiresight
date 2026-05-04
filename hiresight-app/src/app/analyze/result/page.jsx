"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  X,
} from "lucide-react";

// Import komponen shadcn/ui
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Pastikan komponen ini sudah ada di folder ui kamu
import { Separator } from "@/components/ui/separator"; // Opsional untuk garis pembatas yang rapi

export default function AnalyzeResult() {
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Data dummy tetap sama sesuai permintaan
  const results = {
    document: {
      name: "Surya_Jaya_Resume.pdf",
      targetPosition: "Software Engineer",
      date: "03 Mei 2026",
    },
    scores: [
      { label: "ATS Score", value: 85, color: "text-primary" },
      { label: "Keyword Score", value: 72, color: "text-accent" },
      { label: "Format Score", value: 95, color: "text-success" },
    ],
    keywords: {
      found: [
        "React.js",
        "Next.js",
        "Golang",
        "PostgreSQL",
        "Docker",
        "REST API",
      ],
      missing: ["Unit Testing", "CI/CD", "Redis", "Microservices"],
    },
    feedback: [
      {
        category: "Format",
        content:
          "Struktur dokumen sangat baik. Penggunaan font Montserrat konsisten dan mudah dibaca oleh sistem parser.",
      },
      {
        category: "Content",
        content:
          "Deskripsi pengalaman kerja sudah menggunakan metode STAR, namun bagian pencapaian di proyek Soga Farm bisa diperjelas dengan angka metrik.",
      },
      {
        category: "Keywords",
        content:
          "Kapasitas teknis utama sudah terpenuhi, namun tambahkan keyword terkait 'Automated Testing' untuk meningkatkan relevansi.",
      },
    ],
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat p-6 md:p-12 md:pt-32">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary font-bold group p-0 hover:bg-transparent"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back
          </Button>
          <h1 className="text-xl font-bold uppercase tracking-widest text-primary">
            Analyze Result
          </h1>
        </header>

        {/* --- SECTION: DOCUMENT INFORMATION --- */}
        <section className="space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <FileText size={18} /> Document Information
          </h2>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                    Filename
                  </p>
                  <p className="font-bold truncate max-w-[200px] text-sm">
                    {results.document.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                    Target Position
                  </p>
                  <p className="font-bold text-sm">
                    {results.document.targetPosition}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                    Analysis Date
                  </p>
                  <p className="font-bold text-sm">{results.document.date}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 rounded-lg font-bold shadow-sm"
                onClick={() => setIsPreviewOpen(true)}
              >
                <Eye size={16} /> Preview PDF
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* --- SECTION: SCORE OVERVIEW --- */}
        <section className="space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider">
            Score Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {results.scores.map((score, index) => (
              <Card
                key={index}
                className="bg-card border-border group hover:border-primary/50 transition-colors shadow-sm"
              >
                <CardContent className="p-8 text-center space-y-2">
                  <p className="text-4xl font-black tracking-tighter">
                    {score.value}
                    <span className="text-lg text-muted-foreground">%</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {score.label}
                  </p>
                  <Progress value={score.value} className="h-1.5 mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* --- SECTION: KEYWORD ANALYSIS --- */}
        <section className="space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider">
            Keyword Analysis
          </h2>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-success uppercase flex items-center gap-2 tracking-widest">
                  <CheckCircle2 size={14} /> Keywords Found
                </p>
                <div className="flex flex-wrap gap-2">
                  {results.keywords.found.map((kw, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-success/5 text-success border-success/20 font-bold px-3 py-1"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-3">
                <p className="text-[10px] font-black text-destructive uppercase flex items-center gap-2 tracking-widest">
                  <XCircle size={14} /> Missing Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {results.keywords.missing.map((kw, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-destructive/5 text-destructive border-destructive/20 font-bold px-3 py-1"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* --- SECTION: FEEDBACK --- */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-[0.2em]">
              Feedback
            </h2>
            <div className="h-1 w-20 bg-primary mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="space-y-4">
            {results.feedback.map((item, index) => (
              <Card
                key={index}
                className="bg-card border-border hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <AlertCircle size={14} /> {item.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground/80 italic">
                    "{item.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* --- CTA BUTTONS --- */}
        <footer className="pt-10 flex flex-wrap items-center justify-center md:justify-between gap-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full md:w-fit px-10 h-12 rounded-xl font-bold border-border hover:bg-muted"
            onClick={() => router.push("/analyze")}
          >
            <Upload size={18} className="mr-2" /> Upload New
          </Button>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-fit">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 md:w-fit px-10 h-12 rounded-xl font-bold"
              onClick={() => setIsPreviewOpen(true)}
            >
              <Eye size={18} className="mr-2" /> Preview
            </Button>

            <Button
              size="lg"
              className="flex-1 md:w-fit px-10 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              <Download size={18} className="mr-2" /> Download
            </Button>
          </div>
        </footer>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 md:p-10">
          <Card className="relative w-full max-w-5xl h-full bg-card border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <CardHeader className="p-4 border-b border-border bg-muted/30 flex-row justify-between items-center space-y-0">
              <div className="flex items-center gap-3">
                <FileText className="text-primary" />
                <CardTitle className="text-sm font-bold truncate">
                  {results.document.name}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-full h-8 w-8"
              >
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 bg-muted/10 flex items-center justify-center p-8">
              <div className="w-full max-w-2xl aspect-[1/1.4] bg-white shadow-xl rounded-sm border border-border flex items-center justify-center">
                <p className="text-muted-foreground font-medium italic text-xs">
                  PDF Preview Content
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
