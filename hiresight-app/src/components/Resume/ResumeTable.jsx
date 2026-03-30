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
import { Eye, Trash2, FileText } from "lucide-react";

const ResumeTable = ({ data }) => {
  // Logika warna badge sesuai instruksi gambar
  const getScoreBadge = (score) => {
    if (score >= 70) return "bg-success/20 text-success border-success/30";
    if (score >= 50) return "bg-warning/20 text-warning border-warning/30";
    return "bg-error/20 text-error border-error/30";
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-bold">File Name</TableHead>
            <TableHead className="font-bold">ATS Score</TableHead>
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
                  >
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:text-error"
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
  );
};

export default ResumeTable;
