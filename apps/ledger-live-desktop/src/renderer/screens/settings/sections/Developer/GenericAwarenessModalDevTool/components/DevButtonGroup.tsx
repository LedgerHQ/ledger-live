import React from "react";

type DevButtonGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export const DevButtonGroup = ({ children, className }: DevButtonGroupProps) => (
  <div className={`flex flex-row flex-wrap items-center gap-4 ${className ?? ""}`}>{children}</div>
);
