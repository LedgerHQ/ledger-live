import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import type {
  QuickAction,
  QuickActionId,
  QuickActionsPlatform,
  QuickActionTile,
} from "@features/platform-quick-actions";

export type AccountHeroActionId = Exclude<QuickActionId, "connect" | "buyLedger">;

/** Where an action was picked: straight from the hero, or from the "More" sheet (LWM). */
export type AccountHeroActionLocation = "quick_action" | "more";

export type AccountHeroBalance = Readonly<{
  countervalue: number | undefined;
  formatter: (value: number) => FormattedValue;
  discreet: boolean;
  isLoading: boolean;
}>;

export type AccountHeroAvailability = Readonly<{
  isCurrencySupported: boolean;
  isBuyAvailable: boolean;
  isSellAvailable: boolean;
  isSwapAvailable: boolean;
  isEarnAvailable: boolean;
  isSendSupported: boolean;
  isReceiveSupported: boolean;
}>;

export type AccountHeroPort = Readonly<{
  platform: QuickActionsPlatform;
  balance: AccountHeroBalance;
  availability: AccountHeroAvailability;
  hasFunds: boolean;
  hasActivity: boolean;
  /** Ready-to-display address type of the account ("Native segwit"...), shown above the balance. */
  tag?: string;
  onAction: (id: AccountHeroActionId, location?: AccountHeroActionLocation) => void;
  /** The "More" tile was pressed (LWM). */
  onOpenMore?: () => void;
}>;

export type AccountHeroViewModel = Readonly<{
  balance: AccountHeroBalance;
  tag: string | undefined;
  actions: readonly QuickAction[];
  tiles: readonly QuickActionTile[];
  moreActions: readonly QuickAction[];
  isMoreSheetOpen: boolean;
  showSwapConsole: boolean;
  onActionPress: (id: QuickActionId) => void;
  onTilePress: (id: QuickActionTile["id"]) => void;
  onMoreActionPress: (id: QuickActionId) => void;
  onCloseMoreSheet: () => void;
}>;
