import { useCallback, useMemo, useState } from "react";
import {
  layoutQuickActionTiles,
  resolveQuickActions,
  type QuickActionId,
  type QuickActionTile,
} from "@features/platform-quick-actions";
import { resolveSwapConsole } from "../logic/resolveSwapConsole";
import type {
  AccountHeroActionId,
  AccountHeroAvailability,
  AccountHeroPort,
  AccountHeroViewModel,
} from "./types";

const isHeroAction = (id: QuickActionId): id is AccountHeroActionId =>
  id !== "connect" && id !== "buyLedger";

function isTransferCapable(
  id: QuickActionId | QuickActionTile["id"],
  { isSendSupported, isReceiveSupported }: AccountHeroAvailability,
): boolean {
  if (id === "send") return isSendSupported;
  if (id === "receive") return isReceiveSupported;
  return true;
}

export function useAccountHeroViewModel({
  platform,
  balance,
  availability,
  hasFunds,
  onAction,
}: AccountHeroPort): AccountHeroViewModel {
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const actions = useMemo(
    () =>
      resolveQuickActions({
        scope: "account",
        platform,
        hasAccounts: true,
        hasFunds,
        isCurrencySupported: availability.isCurrencySupported,
        isBuyAvailable: availability.isBuyAvailable,
        isSellAvailable: availability.isSellAvailable,
        isSwapAvailable: availability.isSwapAvailable,
        isEarnAvailable: availability.isEarnAvailable,
      }).filter(({ id }) => isTransferCapable(id, availability)),
    [platform, hasFunds, availability],
  );

  const { tiles, moreActions } = useMemo(() => {
    const layout = layoutQuickActionTiles(actions, {
      isSendSupported: availability.isSendSupported,
    });
    return {
      tiles: layout.tiles.filter(({ id }) => isTransferCapable(id, availability)),
      moreActions: layout.moreActions,
    };
  }, [actions, availability]);

  const onActionPress = useCallback(
    (id: QuickActionId) => {
      if (isHeroAction(id)) onAction(id);
    },
    [onAction],
  );

  const onTilePress = useCallback(
    (id: QuickActionTile["id"]) => {
      if (id === "more") {
        setIsMoreSheetOpen(true);
        return;
      }
      onAction(id);
    },
    [onAction],
  );

  const onMoreActionPress = useCallback(
    (id: QuickActionId) => {
      setIsMoreSheetOpen(false);
      onActionPress(id);
    },
    [onActionPress],
  );

  const onCloseMoreSheet = useCallback(() => setIsMoreSheetOpen(false), []);

  return {
    balance,
    actions,
    tiles,
    moreActions,
    isMoreSheetOpen,
    showSwapConsole: resolveSwapConsole(platform, availability),
    onActionPress,
    onTilePress,
    onMoreActionPress,
    onCloseMoreSheet,
  };
}
