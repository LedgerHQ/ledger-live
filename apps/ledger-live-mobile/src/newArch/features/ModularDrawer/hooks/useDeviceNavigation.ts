import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import type { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useSelector } from "~/context/hooks";
import { Account } from "@ledgerhq/types-live";
import type { ModularDrawerProps } from "../ModularDrawer";
import { modularDrawerStateSelector } from "~/reducers/modularDrawer";

type UseDeviceNavigationParams = {
  onClose?: () => void;
  resetSelection: () => void;
  onAccountSelected: ModularDrawerProps["onAccountSelected"];
};

export function useDeviceNavigation({
  onClose,
  resetSelection,
  onAccountSelected,
}: UseDeviceNavigationParams) {
  const navigation = useNavigation();
  const { flow } = useSelector(modularDrawerStateSelector);

  const isInline = flow !== "add_account";

  const onSuccess = useCallback(
    (res?: { scannedAccounts: Account[]; selected: Account[] }) => {
      const newAccount = res?.selected && res.selected.length > 0 ? res.selected[0] : undefined;
      if (newAccount) {
        onAccountSelected?.(newAccount);
      }
    },
    [onAccountSelected],
  );

  const navigateToDevice = useCallback(
    (selectedAsset: CryptoCurrency, createTokenAccount?: boolean) => {
      onClose?.();
      resetSelection();
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: selectedAsset,
          createTokenAccount,
          context: AddAccountContexts.AddAccounts,
          inline: isInline,
          onCloseNavigation: onClose,
          onSuccess,
        },
      });
    },
    [onClose, resetSelection, navigation, isInline, onSuccess],
  );

  const navigateToDeviceWithCurrency = useCallback(
    (selectedCurrency: CryptoOrTokenCurrency) => {
      const isToken = selectedCurrency.type === "TokenCurrency";
      const asset = isToken ? selectedCurrency.parentCurrency : selectedCurrency;
      const createTokenAccount = isToken;
      navigateToDevice(asset, createTokenAccount);
    },
    [navigateToDevice],
  );

  return {
    navigateToDevice,
    navigateToDeviceWithCurrency,
  } as const;
}
