import type { ReactNode } from "react";
import {
  Subheader,
  SubheaderDescription,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";

export function Section({
  title,
  description,
  children,
  badge,
}: Readonly<{ title: string; description?: string; badge?: ReactNode; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-12 rounded-lg bg-surface p-16">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
          {badge}
        </SubheaderRow>
        {description ? <SubheaderDescription>{description}</SubheaderDescription> : null}
      </Subheader>
      {children}
    </section>
  );
}
