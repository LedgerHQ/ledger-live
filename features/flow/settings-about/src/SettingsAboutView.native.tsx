import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import {
  Github,
  Instagram,
  Mobile,
  Note,
  QrCodeScanner,
  StarFill,
  Twitter,
} from "@ledgerhq/lumen-ui-rnative/symbols";
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
    <Box lx={{ paddingHorizontal: "s8", gap: "s24" }} testID={testID}>
      {sections.map(section => (
        <Box key={section.id} lx={{ gap: "s8" }}>
          {section.title ? (
            <Box lx={{ paddingHorizontal: "s8" }}>
              <Subheader>
                <SubheaderRow>
                  <SubheaderTitle>{section.title}</SubheaderTitle>
                </SubheaderRow>
              </Subheader>
            </Box>
          ) : null}
          <SettingsSection testID={testID && `${testID}-${section.id}`}>
            {section.rows.map(({ id, ...row }) => {
              const Icon = ROW_ICONS[id];
              return <SettingsRow key={id} icon={<Icon size={24} />} {...row} />;
            })}
          </SettingsSection>
        </Box>
      ))}
    </Box>
  );
}
