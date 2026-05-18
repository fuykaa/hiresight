"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Trash2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

const ResumeTable = ({ data, onDelete }) => {
  const router = useRouter();
  const getScoreBadge = (score) => {
    if (score === "Belum dianalisis") return "bg-muted/40 text-muted-foreground border-muted/30";
    const num = Number(score);
    if (num >= 70) return "bg-success/20 text-success border-success/30";
    if (num >= 50) return "bg-warning/20 text-warning border-warning/30";
    return "bg-error/20 text-error border-error/30";
  };

  const handleView = (id) => {
    sessionStorage.setItem("resume_id", id);
    router.push("/analyze/result");
  };

  return (
    <>
      {/* Mobile: card layout */}
      <div className="block md:hidden space-y-3">
        {data.map((resume) => (
          <Card key={resume.id} className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium truncate text-sm">{resume.fileName}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`${getScoreBadge(resume.score)} font-bold flex-shrink-0 text-xs`}
                >
                  {resume.score}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground/70">{resume.date}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 hover:text-primary text-xs"
                    onClick={() => handleView(resume.id)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 hover:text-error text-xs"
                    onClick={() => onDelete && onDelete(resume.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">File Name</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="text-right font-bold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((resume) => (
              <TableRow
                key={resume.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    {resume.fileName}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${getScoreBadge(resume.score)} font-bold`}
                  >
                    {resume.score}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground/70">
                  {resume.date}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-primary"
                      onClick={() => handleView(resume.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-error"
                      onClick={() => onDelete && onDelete(resume.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default ResumeTable;
