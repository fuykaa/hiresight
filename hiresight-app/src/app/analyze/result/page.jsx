"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LayoutDashboard,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  Loader2,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";

// Pesan kontekstual berdasarkan profil kandidat
const profileConfig = {
  experienced: {
    label: "Profesional Berpengalaman",
    color: "text-blue-500",
    badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    message:
      "Profil kamu menunjukkan pengalaman kerja yang relevan. Fokus pada mengisi keyword gap berikut untuk memaksimalkan match score dengan posisi ini.",
  },
  fresh_graduate: {
    label: "Fresh Graduate",
    color: "text-green-500",
    badgeCls: "bg-green-500/10 text-green-600 border-green-500/20",
    message:
      "Potensimu sudah terlihat! Perkuat bagian Skills dan tambahkan proyek, magang, atau pengalaman organisasi yang relevan dengan posisi ini.",
  },
  career_changer: {
    label: "Career Changer",
    color: "text-orange-500",
    badgeCls: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    message:
      "Kamu sedang beralih karir. Tonjolkan transferable skills dan jelaskan secara eksplisit bagaimana pengalamanmu sebelumnya relevan dengan posisi ini.",
  },
};

function getScoreColor(score) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-accent";
  return "text-destructive";
}

export default function AnalyzeResult() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }

    const resumeId = sessionStorage.getItem("resume_id");
    if (!resumeId) {
      router.replace("/analyze");
      return;
    }

    const fetchData = async () => {
      try {
        // Ambil data analisis dan data resume secara paralel
        const [analysisRes, resumeRes] = await Promise.all([
          api.get(`/api/analysis/${resumeId}`),
          api.get(`/api/resume/${resumeId}`),
        ]);
        setResult(analysisRes.data);
        setResume(resumeRes.data);
      } catch {
        setError("Gagal memuat hasil analisis. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // State: loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="font-bold tracking-widest uppercase text-sm">
            Memuat hasil analisis...
          </p>
        </div>
      </div>
    );
  }

  // State: error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <AlertCircle size={40} className="text-destructive" />
          <p className="font-bold text-destructive">{error}</p>
          <Button onClick={() => router.push("/analyze")} className="rounded-xl font-bold">
            Kembali ke Upload
          </Button>
        </div>
      </div>
    );
  }

  const keywords = result?.keyword_analysis || [];
  const foundKeywords = keywords.filter((kw) => kw.found_in_cv);
  const missingKeywords = keywords.filter((kw) => !kw.found_in_cv);
  const profile = profileConfig[result?.candidate_profile] || profileConfig.experienced;

  const scores = [
    { label: "ATS Score", value: result?.ats_score ?? 0 },
    { label: "Keyword Score", value: result?.keyword_score ?? 0 },
    { label: "Format Score", value: result?.format_score ?? 0 },
  ];

  const analysisDate = result?.created_at
    ? new Date(result.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "-";

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
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary font-bold p-0 hover:bg-transparent"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Button>
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
                    {resume?.file_name ?? "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                    Target Position
                  </p>
                  <p className="font-bold text-sm">
                    {resume?.job_position || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                    Analysis Date
                  </p>
                  <p className="font-bold text-sm">{analysisDate}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 rounded-lg font-bold shadow-sm"
                onClick={() => {
                  if (!resume?.id) return;
                  window.open(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/resume/preview/${resume?.id}`,
                    "_blank"
                  );
                }}
              >
                <Eye size={16} /> Preview PDF
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* --- SECTION: CANDIDATE PROFILE --- */}
        <section className="space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider">
            Candidate Profile
          </h2>
          <Card className={`border shadow-sm ${profile.badgeCls}`}>
            <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <Badge className={`${profile.badgeCls} font-bold px-3 py-1 text-xs border`}>
                {profile.label}
              </Badge>
              <p className="text-sm leading-relaxed text-foreground/80">
                {profile.message}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* --- SECTION: SCORE OVERVIEW --- */}
        <section className="space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider">
            Score Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scores.map((score, index) => (
              <Card
                key={index}
                className="bg-card border-border group hover:border-primary/50 transition-colors shadow-sm"
              >
                <CardContent className="p-8 text-center space-y-2">
                  <p className={`text-4xl font-black tracking-tighter ${getScoreColor(score.value)}`}>
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
              {/* Keywords ditemukan */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-success uppercase flex items-center gap-2 tracking-widest">
                  <CheckCircle2 size={14} /> Keywords Found ({foundKeywords.length})
                </p>
                {foundKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {foundKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className="bg-success/5 text-success border-success/20 font-bold px-3 py-1"
                        >
                          {kw.keyword}
                          {kw.occurrence_count >= 2 && (
                            <span className="ml-1.5 text-[9px] bg-success/20 text-success rounded px-1 font-black">
                              ×{kw.occurrence_count}
                            </span>
                          )}
                        </Badge>
                        {kw.weight === "required" && (
                          <span className="text-[9px] text-muted-foreground font-bold uppercase">
                            req
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Tidak ada keyword yang ditemukan.
                  </p>
                )}
              </div>

              <Separator className="bg-border/50" />

              {/* Keywords tidak ditemukan */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-destructive uppercase flex items-center gap-2 tracking-widest">
                  <XCircle size={14} /> Missing Keywords ({missingKeywords.length})
                </p>
                {missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missingKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="bg-destructive/5 text-destructive border-destructive/20 font-bold px-3 py-1"
                        >
                          {kw.keyword}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            kw.weight === "required"
                              ? "bg-red-500/10 text-red-600 border-red-400/30 text-[9px] font-black uppercase px-1.5 py-0.5"
                              : "bg-muted text-muted-foreground border-border text-[9px] font-black uppercase px-1.5 py-0.5"
                          }
                        >
                          {kw.weight === "required" ? "Wajib" : "Diutamakan"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Semua keyword ditemukan di CV kamu!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* --- SECTION: FEEDBACK (tampil jika ada isi dari API) --- */}
        {(result?.feedback_format || result?.feedback_content || result?.feedback_keywords) && (
          <section className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-black uppercase tracking-[0.2em]">
                Feedback
              </h2>
              <div className="h-1 w-20 bg-primary mx-auto mt-2 rounded-full"></div>
            </div>

            <div className="space-y-4">
              {[
                { category: "Format", content: result?.feedback_format },
                { category: "Content", content: result?.feedback_content },
                { category: "Keywords", content: result?.feedback_keywords },
              ]
                .filter((item) => item.content)
                .map((item, index) => (
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
                      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                        {item.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* --- CTA BUTTONS --- */}
        <footer className="pt-10 flex flex-wrap items-center justify-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-4 w-full md:w-fit">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 md:w-fit px-10 h-12 rounded-xl font-bold border-border hover:bg-muted"
              onClick={() => router.push("/analyze")}
            >
              <Upload size={18} className="mr-2" /> Upload New
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 md:w-fit px-10 h-12 rounded-xl font-bold border-primary/50 text-primary hover:bg-primary/5"
              onClick={() => {
                if (resume?.id) sessionStorage.setItem("resume_id", resume.id);
                router.push("/analyze");
              }}
            >
              Analisis Ulang
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-fit">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 md:w-fit px-10 h-12 rounded-xl font-bold"
              onClick={() => {
                if (!resume?.id) return;
                window.open(
                  `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/resume/preview/${resume?.id}`,
                  "_blank"
                );
              }}
            >
              <Eye size={18} className="mr-2" /> Preview
            </Button>

            <Button
              size="lg"
              className="flex-1 md:w-fit px-10 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
              onClick={() => {
                const resumeId = sessionStorage.getItem("resume_id");
                if (resumeId) window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/resume/preview/${resumeId}?download=true`, "_blank");
              }}
            >
              <Download size={18} className="mr-2" /> Download
            </Button>
          </div>
        </footer>
      </div>


    </div>
  );
}
