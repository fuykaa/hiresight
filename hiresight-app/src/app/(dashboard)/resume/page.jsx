"use client";

import React, { useState } from "react";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ResumeTable from "@/components/Resume/ResumeTable";

export default function ResumePage() {
  // Mock Data
  const [resumes] = useState([
    {
      id: 1,
      fileName: "Software_Engineer_Alex.pdf",
      score: 85,
      date: "12 Mar 2026",
    },
    {
      id: 2,
      fileName: "Product_Designer_Final.pdf",
      score: 62,
      date: "10 Mar 2026",
    },
    {
      id: 3,
      fileName: "Marketing_Resume_Old.docx",
      score: 45,
      date: "05 Mar 2026",
    },
    { id: 4, fileName: "Fullstack_Dev_V3.pdf", score: 92, date: "01 Mar 2026" },
    {
      id: 5,
      fileName: "Data_Scientist_Intern.pdf",
      score: 78,
      date: "28 Feb 2026",
    },
    {
      id: 6,
      fileName: "UI_UX_Portfolio_2026.pdf",
      score: 88,
      date: "25 Feb 2026",
    },
    {
      id: 7,
      fileName: "Project_Manager_Draft.docx",
      score: 55,
      date: "20 Feb 2026",
    },
    {
      id: 8,
      fileName: "Backend_Go_Developer.pdf",
      score: 71,
      date: "15 Feb 2026",
    },
    {
      id: 9,
      fileName: "System_Analyst_Final.pdf",
      score: 49,
      date: "10 Feb 2026",
    },
    {
      id: 10,
      fileName: "Mobile_Dev_React_Native.pdf",
      score: 95,
      date: "05 Feb 2026",
    },
    {
      id: 11,
      fileName: "DevOps_Engineer_AWS.pdf",
      score: 82,
      date: "01 Feb 2026",
    },
    {
      id: 12,
      fileName: "QA_Automation_Tester.docx",
      score: 67,
      date: "28 Jan 2026",
    },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Hitung indeks data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Data yang ditampilkan di tabel saat ini
  const currentResumes = resumes.slice(indexOfFirstItem, indexOfLastItem);

  // Hitung total halaman
  const totalPages = Math.ceil(resumes.length / itemsPerPage);

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
              className="pl-10 rounded-xl bg-card border-border "
            />
          </div>
          <Button className="w-full md:w-auto rounded-xl font-bold gap-2">
            <Plus size={18} /> Upload Resume
          </Button>
        </div>

        {/* Kirim currentResumes (maks 10) ke tabel */}
        <ResumeTable data={currentResumes} />

        {/* --- KONTROL PAGINATION --- */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-foreground/70">
            Showing{" "}
            <span className="font-bold text-foreground">
              {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, resumes.length)}
            </span>{" "}
            of{" "}
            <span className="font-bold text-foreground">{resumes.length}</span>{" "}
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
                  variant={isActive ? "default" : "outline"} // Gunakan variant default untuk yang aktif
                  size="icon"
                  className={`rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-content border-primary"
                      : "text-foreground/70"
                  }`}
                  // Tambahkan style inline sebagai pengaman terakhir
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
