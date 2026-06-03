import React from "react";

type DevSurfaceSectionProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export const DevSurfaceSection = ({ title, children, className }: DevSurfaceSectionProps) => (
  <section className={`flex flex-col gap-6 ${className ?? ""}`}>
    {title ? <h2 className="body-2-semi-bold text-muted">{title}</h2> : null}
    <div className="flex flex-col gap-6 rounded-lg border border-muted-subtle bg-surface p-6">
      {children}
    </div>
  </section>
);
