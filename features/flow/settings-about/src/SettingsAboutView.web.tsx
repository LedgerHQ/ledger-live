import React from "react";
import { Github, Instagram, Mobile, Note, Twitter } from "@ledgerhq/lumen-ui-react/symbols";
import { SettingsRow, SettingsSection } from "@features/flow-settings";
import type { SettingsAboutRowId, SettingsAboutViewProps } from "./SettingsAbout.types";

const ROW_ICONS = {
  version: Mobile,
  terms: Note,
  x: Twitter,
  instagram: Instagram,
  github: Github,
} as const satisfies Record<SettingsAboutRowId, unknown>;

export function SettingsAboutView({ sections, testID }: SettingsAboutViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid={testID}>
      {sections.map(section => (
        <SettingsSection
          key={section.id}
          title={section.title}
          testID={testID && `${testID}-${section.id}`}
        >
          {section.rows.map(({ id, ...row }) => {
            const Icon = ROW_ICONS[id];
            return <SettingsRow key={id} icon={<Icon size={24} />} {...row} />;
          })}
        </SettingsSection>
      ))}
    </div>
  );
}
