"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ResumeTable from "@/components/Resume/ResumeTable";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import api from "@/lib/api";
import { useCallback } from "react";

const formatDate = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ResumePage() {
  const router = useRouter();
  const { callApi, loading, error } = useApi();
  const [resumes, setResumes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(`/api/resume/${id}`);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // gagal hapus — tidak ubah state
    }
  }, []);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const data = await callApi(api.get("/api/resumes"));
        const resumeList = data || [];

        // Fetch status analisis untuk setiap resume secara paralel
        const analysisResults = await Promise.allSettled(
          resumeList.map((r) => api.get(`/api/analysis/${r.id}`))
        );

        const mapped = resumeList.map((r, i) => {
          const settled = analysisResults[i];
          let scoreValue = "Belum dianalisis";
          if (settled.status === "fulfilled") {
            const analysisData = settled.value.data;
            if (analysisData?.status === "completed") {
              scoreValue = analysisData.ats_score;
            }
          }
          return {
            id:       r.id,
            fileName: r.file_name,
            score:    scoreValue,
            date:     formatDate(r.uploaded_at),
          };
        });

        setResumes(mapped);
      } catch {
        // error sudah di-handle oleh useApi
      }
    };
    fetchResumes();
  }, []);

  const filteredResumes  = resumes.filter((r) =>
    r.fileName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );
  const indexOfLastItem  = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResumes   = filteredResumes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages       = Math.ceil(filteredResumes.length / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat p-6 md:p-12 md:pt-32">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold uppercase tracking-widest text-primary">
            Resume List
          </h1>
          <div className="h-1 w-20 bg-primary rounded-full" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/70" />
            <Input
              placeholder="Search resume..."
              className="pl-10 rounded-xl bg-card border-border"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button
            className="w-full md:w-auto rounded-xl font-bold gap-2"
            onClick={() => router.push("/analyze")}
          >
            <Plus size={18} /> Upload Resume
          </Button>
        </div>

        {/* --- LOADING STATE --- */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="font-bold text-sm tracking-widest uppercase">
              Memuat daftar resume...
            </span>
          </div>
        )}

        {/* --- ERROR STATE --- */}
        {error && !loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-destructive">
            <AlertCircle size={20} />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        {/* --- TABEL --- */}
        {!loading && !error && (
          <>
            {resumes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="font-bold">Belum ada resume yang diupload.</p>
              </div>
            ) : filteredResumes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="font-bold">Tidak ada resume yang cocok dengan pencarian.</p>
              </div>
            ) : (
              <ResumeTable data={currentResumes} onDelete={handleDelete} />
            )}

            {/* --- KONTROL PAGINATION --- */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-foreground/70">
                Showing{" "}
                <span className="font-bold text-foreground">
                  {filteredResumes.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredResumes.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-foreground">{filteredResumes.length}</span>{" "}
                resumes
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => {
                  const isActive = currentPage === i + 1;
                  return (
                    <Button
                      key={i + 1}
                      variant={isActive ? "default" : "outline"}
                      size="icon"
                      className={`rounded-lg transition-all ${
                        isActive
                          ? "bg-primary text-primary-content border-primary"
                          : "text-foreground/70"
                      }`}
                      style={
                        isActive
                          ? { backgroundColor: "var(--p)", color: "var(--pc)" }
                          : {}
                      }
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg text-foreground/70 hover:text-foreground/90"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
