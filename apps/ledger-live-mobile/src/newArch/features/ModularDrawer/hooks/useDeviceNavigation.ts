import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import type { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AssetSelectionNavigationProps } from "../../AssetSelection/types";
import type { StepFlowManagerReturnType } from "./useModularDrawerFlowStepManager";

type UseDeviceNavigationParams = {
  navigationStepManager: StepFlowManagerReturnType;
  enableAccountSelection?: boolean;
  onClose?: () => void;
  resetSelection: () => void;
  selectNetwork?: (a: CryptoOrTokenCurrency, n: CryptoOrTokenCurrency) => void;
};

export function useDeviceNavigation({
  navigationStepManager,
  onClose,
  resetSelection,
}: UseDeviceNavigationParams) {
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();

  const navigateToDevice = useCallback(
    (selectedAsset: CryptoCurrency, createTokenAccount?: boolean) => {
      onClose?.();
      resetSelection();
      navigationStepManager.reset();
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: selectedAsset,
          createTokenAccount,
          context: AddAccountContexts.AddAccounts,
        },
      });
    },
    [navigation, onClose, resetSelection, navigationStepManager],
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
