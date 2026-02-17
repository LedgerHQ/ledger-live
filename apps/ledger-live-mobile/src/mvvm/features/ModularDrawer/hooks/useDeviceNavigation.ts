import { useCallback, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../Accounts/screens/AddAccount/enums";
import type {
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { useSelector } from "~/context/hooks";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { makeEmptyTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { ModularDrawerProps } from "../ModularDrawer";
import { modularDrawerStateSelector } from "~/reducers/modularDrawer";

type UseDeviceNavigationParams = {
  onClose?: () => void;
  resetSelection: () => void;
  onAccountSelected: ModularDrawerProps["onAccountSelected"];
};

function getAccountToReturn(
  parentAccount: Account,
  pendingTokenCurrency: TokenCurrency | null,
): { account: Account | TokenAccount; parent?: Account } {
  if (pendingTokenCurrency) {
    // Find existing token account or create an empty one
    const existingTokenAccount = parentAccount.subAccounts?.find(
      (subAcc): subAcc is TokenAccount =>
        subAcc.type === "TokenAccount" && subAcc.token.id === pendingTokenCurrency.id,
    );
    const tokenAccount =
      existingTokenAccount || makeEmptyTokenAccount(parentAccount, pendingTokenCurrency);
    return { account: tokenAccount, parent: parentAccount };
  }
  return { account: parentAccount };
}

export function useDeviceNavigation({
  onClose,
  resetSelection,
  onAccountSelected,
}: UseDeviceNavigationParams) {
  const navigation = useNavigation();
  const { flow } = useSelector(modularDrawerStateSelector);
  // Store the original token currency to return the correct account type after account creation
  const pendingTokenCurrencyRef = useRef<TokenCurrency | null>(null);

  const isInline = flow !== "add_account";

  const onSuccess = useCallback(
    (res?: { scannedAccounts: Account[]; selected: Account[] }) => {
      const parentAccount = res?.selected && res.selected.length > 0 ? res.selected[0] : undefined;
      if (!parentAccount) return;

      const pendingTokenCurrency = pendingTokenCurrencyRef.current;
      pendingTokenCurrencyRef.current = null;

      // Get the correct account based on the original currency
      const { account, parent } = getAccountToReturn(parentAccount, pendingTokenCurrency);
      onAccountSelected?.(account, parent);
    },
    [onAccountSelected],
  );

  const navigateToDevice = useCallback(
    (selectedAsset: CryptoCurrency, createTokenAccount?: boolean) => {
      onClose?.();
      resetSelection();

      // Number of screens in the navigation stack to pop when closing:
      // SelectDevice (1) + AddAccounts flow (1) = 2 screens to pop
      const navigationDepth = isInline ? 2 : undefined;

      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: selectedAsset,
          createTokenAccount,
          context: AddAccountContexts.AddAccounts,
          inline: isInline,
          onCloseNavigation: onClose,
          navigationDepth,
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

      // Store the token currency so we can return the correct account type in onSuccess
      pendingTokenCurrencyRef.current = isToken ? selectedCurrency : null;

      navigateToDevice(asset, createTokenAccount);
    },
    [navigateToDevice],
  );

  return {
    navigateToDevice,
    navigateToDeviceWithCurrency,
  } as const;
}
