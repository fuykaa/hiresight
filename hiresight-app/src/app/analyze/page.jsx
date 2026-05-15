"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, FileText, X, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

export default function AnalyzePage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("upload"); // upload -> ready -> loading -> error
  const [progress, setProgress] = useState(0);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [prefillResumeId, setPrefillResumeId] = useState(null);
  const [prefillFileName, setPrefillFileName] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    const savedId = sessionStorage.getItem("resume_id");
    if (!savedId) return;
    sessionStorage.removeItem("resume_id");
    setPrefillResumeId(savedId);
    api.get(`/api/resume/${savedId}`)
      .then((res) => setPrefillFileName(res.data?.file_name || "Resume"))
      .catch(() => setPrefillResumeId(null));
  }, []);

  const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const validateAndSetFile = (uploadedFile) => {
    if (!uploadedFile) return;
    if (!ACCEPTED_TYPES.includes(uploadedFile.type)) {
      setStatus("error");
      setErrorMessage("Hanya file PDF atau DOCX yang didukung.");
      return;
    }
    setFile(uploadedFile);
    setStatus("ready");
  };

  const handleUpload = (e) => {
    validateAndSetFile(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!file && !prefillResumeId) return;
    setStatus("loading");
    setProgress(10);
    setErrorMessage("");

    try {
      let resumeId;

      if (prefillResumeId) {
        // Re-analyze: skip upload, gunakan resume yang sudah ada
        resumeId = prefillResumeId;
        setProgress(30);
        await api.post(`/api/analysis/${resumeId}`, { job_description: jobDescription });
      } else {
        // 1. Upload resume beserta job position dan job description
        const formData = new FormData();
        formData.append("file", file);
        formData.append("job_position", jobPosition);
        formData.append("job_description", jobDescription);

        const uploadRes = await api.post("/api/resume/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        resumeId = uploadRes.data.data.id;
        setProgress(30);

        // 2. Trigger analisis AI
        await api.post(`/api/analysis/${resumeId}`);
      }

      setProgress(50);

      // 3. Poll setiap 2 detik sampai status completed atau failed
      pollRef.current = setInterval(async () => {
        try {
          const resultRes = await api.get(`/api/analysis/${resumeId}`);
          const { status: analysisStatus } = resultRes.data;

          if (analysisStatus === "completed") {
            clearInterval(pollRef.current);
            setProgress(100);
            sessionStorage.setItem("resume_id", resumeId);
            router.push("/analyze/result");
          } else if (analysisStatus === "failed") {
            clearInterval(pollRef.current);
            setStatus("error");
            setErrorMessage(
              "Ekstraksi teks gagal. Pastikan PDF berbasis teks (bukan hasil scan/gambar) atau file DOCX tidak rusak."
            );
          } else {
            setProgress((prev) => Math.min(prev + 5, 90));
          }
        } catch {
          clearInterval(pollRef.current);
          setStatus("error");
          setErrorMessage("Polling status analisis gagal. Respons server tidak valid atau koneksi terputus.");
        }
      }, 2000);
    } catch {
      setStatus("error");
      setErrorMessage("Upload gagal. Periksa format file, ukuran maksimal, dan stabilitas koneksi.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat p-6 md:p-12 md:pt-32">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between border-b border-border pb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold mb-8 group bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back
          </button>
          <h1 className="text-xl font-bold uppercase tracking-widest text-primary">
            Upload & Analyze
          </h1>
        </header>

        <div className="space-y-8">
          {/* --- UPLOADED FILE SECTION --- */}
          <div className="space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wider">
              Uploaded File
            </h2>

            {prefillResumeId ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-bold truncate max-w-[200px] md:max-w-sm">
                      {prefillFileName}
                    </p>
                    <p className="text-xs text-foreground/70">Resume tersimpan</p>
                  </div>
                </CardContent>
              </Card>
            ) : !file ? (
              <>
                <label
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-2xl bg-card hover:border-primary cursor-pointer transition-all group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    validateAndSetFile(e.dataTransfer.files[0]);
                  }}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-foreground/70 group-hover:text-primary transition-colors" />
                    <p className="mb-2 text-sm font-bold">
                      Click or drag and drop to upload
                    </p>
                    <p className="text-xs text-foreground/70">
                      PDF atau DOCX (Max. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                    accept=".pdf,.docx"
                  />
                </label>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  PDF berbasis teks atau DOCX (Word) didukung.{" "}
                  PDF hasil scan atau gambar tidak dapat diproses.
                </p>
              </>
            ) : (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold truncate max-w-[200px] md:max-w-sm">
                        {file.name}
                      </p>
                      <p className="text-xs text-foreground/70">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setStatus("upload");
                    }}
                    className="text-error hover:bg-error/10"
                  >
                    <X size={20} />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* --- FORM SECTION --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wider">
                Job Position
              </h2>
              <Input
                placeholder="Ex: Software Engineer..."
                className="rounded-xl h-12 bg-card border-border focus:ring-primary"
                value={jobPosition}
                onChange={(e) => setJobPosition(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wider">
                Job Description
              </h2>
              <Textarea
                placeholder="Paste job requirements here..."
                className="rounded-xl min-h-[120px] bg-card border-border focus:ring-primary leading-relaxed"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          {/* --- ANALYZE ACTION / LOADING / ERROR --- */}
          <div className="pt-8 flex flex-col items-center gap-6">
            {status === "loading" ? (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                  <Loader2 className="animate-spin" />
                  <span className="font-bold tracking-widest uppercase">
                    AI Analyzing...
                  </span>
                </div>
                <Progress
                  value={progress}
                  className="h-3 rounded-full bg-muted overflow-hidden"
                />
                <p className="text-xs text-foreground/70 italic">
                  Comparing your skills with job requirements...
                </p>
              </div>
            ) : status === "error" ? (
              <div className="w-full max-w-md space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-destructive">
                  <AlertCircle size={20} />
                  <span className="font-bold text-sm">{errorMessage}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatus(prefillResumeId || file ? "ready" : "upload");
                    setErrorMessage("");
                    setProgress(0);
                  }}
                  className="rounded-xl font-bold"
                >
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <Button
                disabled={!file && !prefillResumeId}
                onClick={handleAnalyze}
                size="lg"
                className="w-full md:w-fit px-12 h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Analyze Resume
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
