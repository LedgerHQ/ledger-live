import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import type {
  QuickAction,
  QuickActionId,
  QuickActionsPlatform,
  QuickActionTile,
} from "@features/platform-quick-actions";

export type AccountHeroActionId = Exclude<QuickActionId, "connect" | "buyLedger">;

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
  onAction: (id: AccountHeroActionId) => void;
}>;

export type AccountHeroViewModel = Readonly<{
  balance: AccountHeroBalance;
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
