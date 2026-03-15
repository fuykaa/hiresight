import React from "react";
import { FileText, Calendar, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const RecentAnalysis = ({ data }) => {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Recent Analysis</h2>
        <Button
          variant="ghost"
          className="text-primary hover:text-primary hover:bg-primary/10 font-bold"
        >
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((item) => (
          <Card
            key={item.id}
            className="group overflow-hidden border-border shadow-sm hover:shadow-md transition-all"
          >
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <FileText size={20} />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-success/20 text-success border-none font-bold"
                >
                  {item.score}/100
                </Badge>
              </div>
              <CardTitle className="text-lg font-bold truncate">
                {item.fileName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 pt-1 text-foreground/70 text-sm">
                <Calendar size={14} />
                {item.date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full font-bold gap-2 group/btn border-border hover:bg-primary hover:text-neutral-content transition-all"
              >
                View Result
                <ExternalLink
                  size={14}
                  className="group-hover/btn:translate-x-0.5 transition-transform"
                />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default RecentAnalysis;
