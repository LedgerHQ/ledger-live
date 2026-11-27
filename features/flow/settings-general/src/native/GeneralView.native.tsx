import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Coins, Language, Refresh, ThemeFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { SettingsRow } from "@features/flow-settings";
import { GeneralChoiceSheet } from "./GeneralChoiceSheet";
import type {
  GeneralSectionSheetsViewModel,
  GeneralSheetId,
} from "./useGeneralSectionSheetsViewModel";

const ROW_ICONS: Readonly<Record<GeneralSheetId, typeof Refresh>> = {
  theme: ThemeFill,
  language: Language,
  currency: Coins,
};

const PICKER_ROWS: readonly GeneralSheetId[] = ["theme", "language", "currency"];

type GeneralViewProps = GeneralSectionSheetsViewModel & Readonly<{ testID?: string }>;

export function GeneralView({
  labels,
  ledgerSync,
  currentLabels,
  openSheet,
  onOpenSheet,
  onCloseSheet,
  testID,
}: GeneralViewProps) {
  return (
    <Box testID={testID}>
      <SettingsRow
        title={labels.ledgerSync.title}
        description={labels.ledgerSync.description}
        icon={<Refresh size={24} color="base" />}
        trailing={{ type: "chevron", onSelect: ledgerSync.onOpen }}
        settingId="ledgerSync"
        testID="settings-general-ledgerSync"
      />
      {PICKER_ROWS.map(id => {
        const Icon = ROW_ICONS[id];
        return (
          <SettingsRow
            key={id}
            title={labels[id].title}
            description={currentLabels[id]}
            icon={<Icon size={24} color="base" />}
            trailing={{ type: "chevron", onSelect: () => onOpenSheet(id) }}
            testID={`settings-general-${id}`}
          />
        );
      })}
      <GeneralChoiceSheet sheet={openSheet} search={labels.search} onClose={onCloseSheet} />
    </Box>
  );
}
