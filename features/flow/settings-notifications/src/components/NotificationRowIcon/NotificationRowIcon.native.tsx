import React from "react";
import {
  Bell,
  Compass,
  LedgerLogo,
  Medal1,
  Percentage,
  TransferHorizontal,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { NotificationKey } from "../../types";

const ICON_SIZE = 24;

const ICONS = {
  areNotificationsAllowed: Bell,
  announcementsCategory: LedgerLogo,
  totalMarketCap: Compass,
  largeMoverCategory: Percentage,
  topGainersLosers: Medal1,
  transactionsAlertsCategory: TransferHorizontal,
} as const satisfies Record<NotificationKey, unknown>;

type NotificationRowIconProps = Readonly<{ id: NotificationKey; disabled?: boolean }>;

export function NotificationRowIcon({ id, disabled }: NotificationRowIconProps) {
  const Icon = ICONS[id];
  return <Icon size={ICON_SIZE} color={disabled ? "disabled" : "base"} />;
}
