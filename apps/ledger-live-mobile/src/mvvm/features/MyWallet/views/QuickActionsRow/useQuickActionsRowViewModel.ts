import { useCallback, useMemo } from "react";
import { TileButtonProps } from "@ledgerhq/lumen-ui-rnative";
import { ShieldCheckNotification, LifeRing, Gift } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

export interface QuickActionRowItem {
  readonly id: string;
  readonly label: string;
  readonly icon: TileButtonProps["icon"];
  readonly onPress: () => void;
  readonly testID: string;
}

interface QuickActionsRowViewModel {
  readonly actions: readonly QuickActionRowItem[];
}

export const useQuickActionsRowViewModel = (): QuickActionsRowViewModel => {
  const { t } = useTranslation();

  const handleRecoverPress = useCallback(() => {
    // TODO: implement recover navigation
  }, []);

  const handleHelpPress = useCallback(() => {
    // TODO: implement help navigation
  }, []);

  const handleReferralPress = useCallback(() => {
    // TODO: implement referral navigation
  }, []);

  const actions: readonly QuickActionRowItem[] = useMemo(
    () => [
      {
        id: "recover",
        label: t("myWallet.quickActions.recover"),
        icon: ShieldCheckNotification,
        onPress: handleRecoverPress,
        testID: "my-wallet-quick-action-recover",
      },
      {
        id: "help",
        label: t("myWallet.quickActions.help"),
        icon: LifeRing,
        onPress: handleHelpPress,
        testID: "my-wallet-quick-action-help",
      },
      {
        id: "referral",
        label: t("myWallet.quickActions.referral"),
        icon: Gift,
        onPress: handleReferralPress,
        testID: "my-wallet-quick-action-referral",
      },
    ],
    [t, handleRecoverPress, handleHelpPress, handleReferralPress],
  );

  return { actions };
};
