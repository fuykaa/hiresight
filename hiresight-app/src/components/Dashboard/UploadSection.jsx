import React from "react";
import { Upload, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const UploadSection = () => {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Upload Resume</h2>
      <Card className="relative group overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary transition-all cursor-pointer">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="relative flex flex-col items-center justify-center text-center p-12">
          <div className="w-16 h-16 bg-muted text-primary rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">
            Click or drag and drop to upload
          </h3>
          <p className="text-foreground/70 mb-8">
            Support PDF, DOCX (Max. 5MB)
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 font-bold gap-2 h-12 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Plus size={20} />
            Analyze New Resume
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default UploadSection;
