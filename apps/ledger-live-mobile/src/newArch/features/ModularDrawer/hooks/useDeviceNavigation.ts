import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import type { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AssetSelectionNavigationProps } from "../../AssetSelection/types";
import { useDispatch } from "react-redux";
import { setStep } from "~/reducers/modularDrawer";
import { ModularDrawerStep } from "../types";
import { AccountLike, Account } from "@ledgerhq/types-live";

type UseDeviceNavigationParams = {
  onClose?: () => void;
  resetSelection: () => void;
  onAccountSelected?: (account: AccountLike) => void;
};

export function useDeviceNavigation({
  onClose,
  resetSelection,
  onAccountSelected,
}: UseDeviceNavigationParams) {
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();
  const dispatch = useDispatch();

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
          inline: Boolean(onAccountSelected),
          onSuccess,
        },
      });
      dispatch(setStep(ModularDrawerStep.Asset));
    },
    [onClose, resetSelection, dispatch, navigation, onAccountSelected, onSuccess],
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
