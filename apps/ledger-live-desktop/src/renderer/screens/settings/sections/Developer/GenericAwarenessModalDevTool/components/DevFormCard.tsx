import React from "react";

type DevFormCardProps = {
  children: React.ReactNode;
};

export const DevFormCard = ({ children }: DevFormCardProps) => (
  <div className="flex flex-col gap-6 rounded-lg border border-muted-subtle bg-canvas p-6 shadow-sm">
    {children}
  </div>
);
