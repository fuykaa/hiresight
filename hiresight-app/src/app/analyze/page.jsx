"use client";

import React, { useState } from "react";
import { ArrowLeft, Upload, FileText, X, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export default function AnalyzePage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("upload"); // upload -> ready -> loading
  const [progress, setProgress] = useState(0);

  const handleUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setStatus("ready");
    }
  };

  const handleAnalyze = () => {
    setStatus("loading");
    // Simulasi Progress AI
    let val = 0;
    const interval = setInterval(() => {
      val += 10;
      setProgress(val);
      if (val >= 100) {
        clearInterval(interval);
        // Navigasi ke hasil setelah selesai (Opsional)
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat p-6 md:p-12 md:pt-32">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors font-bold group"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back
          </Link>
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

            {!file ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-2xl bg-card hover:border-primary cursor-pointer transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-foreground/70 group-hover:text-primary transition-colors" />
                  <p className="mb-2 text-sm font-bold">
                    Click or drag and drop to upload
                  </p>
                  <p className="text-xs text-foreground/70">
                    PDF or DOCX (Max. 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  accept=".pdf,.docx"
                />
              </label>
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
              />
            </div>
            <div className="space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wider">
                Job Description
              </h2>
              <Textarea
                placeholder="Paste job requirements here..."
                className="rounded-xl min-h-[120px] bg-card border-border focus:ring-primary leading-relaxed"
              />
            </div>
          </div>

          {/* --- ANALYZE ACTION / LOADING --- */}
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
            ) : (
              <Button
                disabled={!file}
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
