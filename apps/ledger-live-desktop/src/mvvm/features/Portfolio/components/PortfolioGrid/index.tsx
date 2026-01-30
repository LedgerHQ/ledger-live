import React from "react";

interface PortfolioGridProps {
  readonly children: React.ReactNode;
}

export const PortfolioGrid = ({ children }: PortfolioGridProps) => (
  <div className="grid grid-cols-[2fr_1fr] gap-2">{children}</div>
);
