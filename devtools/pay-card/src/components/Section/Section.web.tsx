import type { ReactNode } from "react";

export interface SectionProps {
  readonly title: string;
  /** Tints the whole section, so sections that are read against each other stay told apart. */
  readonly backgroundColor?: "activeSubtle" | "warning" | "success";
  readonly children: ReactNode;
}

const TINTS = {
  activeSubtle: "bg-active-subtle",
  warning: "bg-warning",
  success: "bg-success",
} as const;

export function Section({ title, backgroundColor, children }: SectionProps) {
  const tint = backgroundColor === undefined ? "" : ` ${TINTS[backgroundColor]}`;

  return (
    <section className={`flex flex-col gap-12 p-16${tint}`}>
      <h3 className="body-2-semi-bold text-base">{title}</h3>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}
