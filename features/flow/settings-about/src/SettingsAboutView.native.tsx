import React from "react";
import { SettingsRow, SettingsSection } from "@features/flow-settings";
import type { SettingsAboutViewProps } from "./SettingsAbout.types";

export function SettingsAboutView({ sections, testID }: SettingsAboutViewProps) {
  return (
    <>
      {sections.map(section => (
        <SettingsSection
          key={section.id}
          title={section.title}
          testID={testID && `${testID}-${section.id}`}
        >
          {section.rows.map(({ id, ...row }) => (
            <SettingsRow key={id} {...row} />
          ))}
        </SettingsSection>
      ))}
    </>
  );
}
