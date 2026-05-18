"use client";

import React, { useEffect, useState } from "react";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatsCards from "@/components/Dashboard/StatsCards";
import RecentAnalysis from "@/components/Dashboard/RecentAnalysis";
import UploadSection from "@/components/Dashboard/UploadSection";
import api from "@/lib/api";

const formatDate = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DashboardPage = () => {
  const [resumes, setResumes] = useState([]);
  const [profileName, setProfileName] = useState("...");
  const [analysisStats, setAnalysisStats] = useState({ completed_count: 0, highest_score: 0, highest_score_resume_id: "" });
  const [recentScores, setRecentScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumesRes, profileRes, statsRes] = await Promise.all([
          api.get("/api/resumes"),
          api.get("/api/profile"),
          api.get("/api/analysis/stats"),
        ]);
        const fetchedResumes = resumesRes.data || [];
        setResumes(fetchedResumes);
        setProfileName(profileRes.data?.full_name || "User");
        setAnalysisStats(statsRes.data || { completed_count: 0, highest_score: 0 });

        const top3 = fetchedResumes.slice(0, 3);
        const analysisResults = await Promise.allSettled(
          top3.map((r) => api.get(`/api/analysis/${r.id}`))
        );
        const scores = {};
        analysisResults.forEach((result, i) => {
          if (
            result.status === "fulfilled" &&
            result.value.data?.status === "completed"
          ) {
            scores[top3[i].id] = result.value.data.ats_score;
          }
        });
        setRecentScores(scores);
      } catch {
        // gagal fetch — biarkan state default
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3 resume terbaru untuk section Recent Analysis
  const recentResumes = resumes.slice(0, 3).map((r) => ({
    id: r.id,
    fileName: r.file_name,
    score: recentScores[r.id] !== undefined ? recentScores[r.id] : "—",
    date: formatDate(r.uploaded_at),
  }));

  const statsData = [
    { label: "Total Resume",     value: loading ? "..." : resumes.length.toString(),                                                        type: "total" },
    { label: "Skor Tertinggi",   value: loading ? "..." : (analysisStats.completed_count > 0 ? analysisStats.highest_score.toString() : "—"), type: "avg", resumeId: analysisStats.highest_score_resume_id },
    { label: "Total Dianalisis", value: loading ? "..." : analysisStats.completed_count.toString(),                                          type: "done"  },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat p-6 pt-24 md:p-12 md:pt-32">
      <div className="max-w-6xl mx-auto space-y-12">
        <DashboardHeader name={profileName} />
        <StatsCards stats={statsData} />
        {!loading && recentResumes.length > 0 && (
          <RecentAnalysis data={recentResumes} />
        )}
        {!loading && recentResumes.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <p className="font-bold">Belum ada resume. Upload sekarang untuk mulai analisis!</p>
          </div>
        )}
        <UploadSection />
      </div>
    </div>
  );
};

export default DashboardPage;
