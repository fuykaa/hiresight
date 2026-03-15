"use client";

import React from "react";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatsCards from "@/components/Dashboard/StatsCards";
import RecentAnalysis from "@/components/Dashboard/RecentAnalysis";
import UploadSection from "@/components/Dashboard/UploadSection";

const DashboardPage = () => {
  // Data Mocking
  const statsData = [
    { label: "Total Resume", value: "12", type: "total" },
    { label: "AVG ATS Score", value: "78%", type: "avg" },
    { label: "Analysis Done", value: "45", type: "done" },
  ];

  const recentAnalysisData = [
    {
      id: 1,
      fileName: "Frontend_Dev_Resume_v1.pdf",
      score: 85,
      date: "Oct 24, 2025",
    },
    {
      id: 2,
      fileName: "Frontend_Dev_Resume_v2.pdf",
      score: 85,
      date: "Oct 24, 2025",
    },
    {
      id: 3,
      fileName: "Frontend_Dev_Resume_v3.pdf",
      score: 85,
      date: "Oct 24, 2025",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-montserrat p-6 md:p-12 md:pt-30">
      <div className="max-w-6xl mx-auto space-y-12">
        <DashboardHeader name="Alex" />
        <StatsCards stats={statsData} />
        <RecentAnalysis data={recentAnalysisData} />
        <UploadSection />
      </div>
    </div>
  );
};

export default DashboardPage;
