import type { ReactNode } from "react";

export interface SectionProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-12 p-16">
      <h3 className="body-2-semi-bold text-base">{title}</h3>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}
