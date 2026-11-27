import React from "react";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import {
  Github,
  Instagram,
  Mobile,
  Note,
  QrCodeScanner,
  StarFill,
  Twitter,
} from "@ledgerhq/lumen-ui-react/symbols";
import { SettingsRow, SettingsSection } from "@features/flow-settings";
import type { SettingsAboutRowId, SettingsAboutViewProps } from "./SettingsAbout.types";

const ROW_ICONS = {
  version: Mobile,
  terms: Note,
  feedback: QrCodeScanner,
  rate: StarFill,
  x: Twitter,
  instagram: Instagram,
  github: Github,
} as const satisfies Record<SettingsAboutRowId, unknown>;

export function SettingsAboutView({ sections, testID }: SettingsAboutViewProps) {
  return (
    <div className="flex flex-col gap-24" data-testid={testID}>
      {sections.map(section => (
        <section key={section.id} className="flex flex-col gap-8">
          {section.title ? (
            <Subheader>
              <SubheaderRow>
                <SubheaderTitle as="h2">{section.title}</SubheaderTitle>
              </SubheaderRow>
            </Subheader>
          ) : null}
          <SettingsSection testID={testID && `${testID}-${section.id}`}>
            {section.rows.map(({ id, ...row }) => {
              const Icon = ROW_ICONS[id];
              return <SettingsRow key={id} icon={<Icon size={24} />} {...row} />;
            })}
          </SettingsSection>
        </section>
      ))}
    </div>
  );
}
