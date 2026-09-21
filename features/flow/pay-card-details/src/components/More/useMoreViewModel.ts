import { useState } from "react";
import { useGetUserQuery } from "@domain/api-card-management";
import type { PayCardUser } from "@domain/api-card-management";
import { useTranslation } from "@shared/i18n";
import { useIsCardSignedIn, useCardLogout } from "@features/flow-pay-card-auth/hooks";
import type { MoreRow, MoreRowId, MoreViewModel } from "./types";

const ROW_ORDER: readonly MoreRowId[] = ["managePin", "accessBaanx", "help", "logout"];

const noop = () => {};

export type MoreLabels = Readonly<{
  more: string;
  sheetTitle: string;
  rows: Readonly<Record<MoreRowId, string>>;
}>;

export type MoreHandlers = Readonly<
  Partial<Record<Exclude<MoreRowId, "logout">, () => void>> & Record<"logout", () => void>
>;

type MapUserToViewModelInput = Readonly<{
  isSignedIn: boolean;
  user: PayCardUser | undefined;
  labels: MoreLabels;
  isSheetOpen: boolean;
  onMorePress: () => void;
  onSheetClose: () => void;
  handlers: MoreHandlers;
}>;

export function mapUserToViewModel({
  isSignedIn,
  user,
  labels,
  isSheetOpen,
  onMorePress,
  onSheetClose,
  handlers,
}: MapUserToViewModelInput): MoreViewModel {
  if (!isSignedIn || !user) {
    return null;
  }

  const rows: readonly MoreRow[] = ROW_ORDER.map(id => ({
    id,
    title: labels.rows[id],
    onPress: handlers[id] ?? noop,
  }));

  return {
    moreLabel: labels.more,
    sheetTitle: labels.sheetTitle,
    rows,
    isSheetOpen,
    onMorePress,
    onSheetClose,
  };
}

export function useMoreViewModel(): MoreViewModel {
  const { t } = useTranslation();
  const isSignedIn = useIsCardSignedIn();
  const logout = useCardLogout();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [wasSignedIn, setWasSignedIn] = useState(isSignedIn);

  if (wasSignedIn !== isSignedIn) {
    setWasSignedIn(isSignedIn);
    setSheetOpen(false);
  }

  const { data: user } = useGetUserQuery(undefined, { skip: !isSignedIn });

  const onMorePress = () => setSheetOpen(true);
  const onSheetClose = () => setSheetOpen(false);

  const onLogoutPress = () => {
    setSheetOpen(false);
    logout();
  };

  const labels: MoreLabels = {
    more: t("payTab.cardMore.tile"),
    sheetTitle: t("payTab.cardMore.title"),
    rows: {
      managePin: t("payTab.cardMore.rows.managePin"),
      accessBaanx: t("payTab.cardMore.rows.accessBaanx"),
      help: t("payTab.cardMore.rows.help"),
      logout: t("payTab.cardMore.rows.logout"),
    },
  };

  const handlers: MoreHandlers = { logout: onLogoutPress };

  return mapUserToViewModel({
    isSignedIn,
    user,
    labels,
    isSheetOpen: sheetOpen,
    onMorePress,
    onSheetClose,
    handlers,
  });
}
