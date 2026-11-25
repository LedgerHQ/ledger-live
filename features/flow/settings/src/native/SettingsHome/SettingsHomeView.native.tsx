import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import {
  Bell,
  Bug,
  Code,
  CoinsCrypto,
  LedgerLogo,
  Lock,
  Mobile,
  ShieldMore,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { SettingsRow } from "../../components/SettingsRow/SettingsRow";
import type { SettingsHomeSectionId } from "../../logic/settingsHomeSections";
import type { SettingsHomeDevToolRow, SettingsHomeViewModel } from "./useSettingsHomeViewModel";

const SECTION_ICONS: Readonly<Record<SettingsHomeSectionId, typeof Mobile>> = {
  general: Mobile,
  assetManagement: CoinsCrypto,
  security: ShieldMore,
  notifications: Bell,
  privacy: Lock,
  about: LedgerLogo,
};

const DEV_TOOL_ICONS: Readonly<Record<SettingsHomeDevToolRow["id"], typeof Mobile>> = {
  developer: Code,
  debug: Bug,
};

type SettingsHomeViewProps = SettingsHomeViewModel & Readonly<{ testID?: string }>;

export function SettingsHomeView({
  rows,
  devToolRows,
  onSelectSection,
  testID,
}: SettingsHomeViewProps) {
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
      {devToolRows.map(row => {
        const Icon = DEV_TOOL_ICONS[row.id];
        return (
          <SettingsRow
            key={row.id}
            title={row.label}
            icon={<Icon size={24} color="base" />}
            trailing={{ type: "chevron", onSelect: row.onSelect }}
            testID={`settings-home-${row.id}`}
          />
        );
      })}
    </Box>
  );
}
