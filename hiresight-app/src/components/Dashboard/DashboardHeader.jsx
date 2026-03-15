import React from "react";

const DashboardHeader = ({ name }) => {
  return (
    <header className="border-b border-border pb-8 flex flex-col gap-2">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
        Welcome back, <span className="text-primary">{name}!</span>
      </h1>
      <p className="text-foreground">
        Here’s what’s happening with your resumes today.
      </p>
    </header>
  );
};

export default DashboardHeader;
