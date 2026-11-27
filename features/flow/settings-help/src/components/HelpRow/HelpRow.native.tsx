import React from "react";
import { SettingsRow, type SettingsRowTrailing } from "@features/flow-settings";
import { Download, Information, LifeRing, Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { HelpItemId } from "../../logic/helpItems";
import type { HelpRowViewModel } from "../../useHelpViewModel";
import type { HelpRowProps } from "./HelpRow.types";

const ROW_ICONS: Readonly<Partial<Record<HelpItemId, typeof LifeRing>>> = {
  support: LifeRing,
  academy: Information,
  saveLogs: Download,
  status: Information,
  clearCache: Trash,
};

function toTrailing({ action, onPress }: HelpRowViewModel): SettingsRowTrailing | undefined {
  if (!onPress) return undefined;
  return { type: action === "external" ? "externalLink" : "chevron", onSelect: onPress };
}

export function HelpRow({ row }: HelpRowProps) {
  const Icon = ROW_ICONS[row.id];
  return (
    <SettingsRow
      title={row.title}
      description={row.description}
      icon={Icon ? <Icon size={24} /> : undefined}
      trailing={toTrailing(row)}
      testID={`settings-help-${row.id}`}
    />
  );
}
