import React from "react";
import { SectionHeader, SectionHeaderTitle } from "@ledgerhq/lumen-ui-react";
import type { SettingsSectionProps } from "./SettingsSection.types";

export function SettingsSection({ title, children, testID }: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-8" data-testid={testID}>
      {title ? (
        <SectionHeader>
          <SectionHeaderTitle>{title}</SectionHeaderTitle>
        </SectionHeader>
      ) : null}
      <div className="flex flex-col rounded-lg bg-surface p-8">{children}</div>
    </section>
  );
}
