import React from "react";
import { FileText, TrendingUp, CheckCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

const StatsCards = ({ stats }) => {
  const iconMap = {
    total: { icon: FileText, color: "primary" },
    avg: { icon: TrendingUp, color: "secondary" },
    done: { icon: CheckCircle, color: "success" },
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Config = iconMap[stat.type];
        return (
          <Card
            key={index}
            className={`hover:border-${Config.color} transition-colors duration-300`}
          >
            <CardHeader className="flex flex-row items-center gap-5 pb-2">
              <div
                className={`w-12 h-12 bg-${Config.color}/10 text-${Config.color} rounded-2xl flex items-center justify-center`}
              >
                <Config.icon size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </span>
                <span
                  className={`text-3xl font-bold font-mono text-${Config.color}`}
                >
                  {stat.value}
                </span>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </section>
  );
};

export default StatsCards;
