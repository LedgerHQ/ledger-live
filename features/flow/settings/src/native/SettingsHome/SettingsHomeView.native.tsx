import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import {
  Bell,
  CoinsCrypto,
  LedgerLogo,
  Lock,
  Mobile,
  ShieldMore,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { SettingsRow } from "../../components/SettingsRow/SettingsRow";
import type { SettingsHomeSectionId } from "../../logic/settingsHomeSections";
import type { SettingsHomeViewModel } from "./useSettingsHomeViewModel";

const SECTION_ICONS: Readonly<Record<SettingsHomeSectionId, typeof Mobile>> = {
  general: Mobile,
  assetManagement: CoinsCrypto,
  security: ShieldMore,
  notifications: Bell,
  privacy: Lock,
  about: LedgerLogo,
};

type SettingsHomeViewProps = SettingsHomeViewModel & Readonly<{ testID?: string }>;

export function SettingsHomeView({ rows, onSelectSection, testID }: SettingsHomeViewProps) {
  return (
    <Box lx={{ paddingHorizontal: "s8" }} testID={testID}>
      {rows.map(row => {
        const Icon = SECTION_ICONS[row.id];
        return (
          <SettingsRow
            key={row.id}
            title={row.label}
            icon={<Icon size={24} color="base" />}
            trailing={{ type: "chevron", onSelect: () => onSelectSection(row.id) }}
            testID={`settings-home-${row.id}`}
          />
        );
      })}
    </Box>
  );
}
