import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import type { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AssetSelectionNavigationProps } from "../../AssetSelection/types";
import { useDispatch } from "react-redux";
import { setStep } from "~/reducers/modularDrawer";
import { ModularDrawerStep } from "../types";

type UseDeviceNavigationParams = {
  onClose?: () => void;
  resetSelection: () => void;
};

export function useDeviceNavigation({ onClose, resetSelection }: UseDeviceNavigationParams) {
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();
  const dispatch = useDispatch();

  const navigateToDevice = useCallback(
    (selectedAsset: CryptoCurrency, createTokenAccount?: boolean) => {
      onClose?.();
      resetSelection();
      dispatch(setStep(ModularDrawerStep.Asset));
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: selectedAsset,
          createTokenAccount,
          context: AddAccountContexts.AddAccounts,
        },
      });
    },
    [onClose, resetSelection, dispatch, navigation],
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
