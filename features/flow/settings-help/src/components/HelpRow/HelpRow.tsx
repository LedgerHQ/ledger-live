import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import {
  Bolt,
  Clear,
  Download,
  HatSchool,
  ListEye,
  Question,
  Coins,
  Trash,
  Wifi,
  LedgerDevices,
} from "@ledgerhq/lumen-ui-react/symbols";
import type { HelpItemId } from "../../logic/helpItems";
import type { HelpSlots } from "../../types";
import type { HelpRowViewModel } from "../../useHelpViewModel";
import { HelpRowTrailing } from "../HelpRowTrailing/HelpRowTrailing";

const ROW_ICONS = {
  support: Question,
  academy: HatSchool,
  saveLogs: Download,
  status: ListEye,
  clearCache: Clear,
  viewUserData: Coins,
  troubleshootNetwork: Wifi,
  repairDevice: Bolt,
  launchOnboarding: LedgerDevices,
  resetApp: Trash,
} as const satisfies Record<HelpItemId, unknown>;

export type HelpRowProps = Readonly<{ row: HelpRowViewModel; slots: HelpSlots }>;

export function HelpRow({ row, slots }: HelpRowProps) {
  const Icon = ROW_ICONS[row.id];
  return (
    <ListItem
      className="h-auto py-12"
      onClick={row.action === "external" ? row.onPress : undefined}
      data-testid={`settings-help-${row.id}`}
    >
      <ListItemLeading>
        <Icon size={24} />
        <ListItemContent>
          <ListItemTitle>{row.title}</ListItemTitle>
          <ListItemDescription>{row.description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <HelpRowTrailing row={row} slots={slots} />
      </ListItemTrailing>
    </ListItem>
  );
}
