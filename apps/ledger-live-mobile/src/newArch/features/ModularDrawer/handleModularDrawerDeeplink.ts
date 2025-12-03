import { getStateFromPath } from "@react-navigation/native";
import { Dispatch } from "redux";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";
import { openModularDrawer } from "~/reducers/modularDrawer";
import { callbackRegistry } from "LLM/features/ModularDrawer/hooks/useCallbackRegistry/registries";
import { generateCallbackId } from "LLM/features/ModularDrawer/utils/callbackIdGenerator";
import { navigationRef } from "~/rootnavigation";
import { NavigatorName, ScreenName } from "~/const";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { AccountLike } from "@ledgerhq/types-live";

// Receive Case
const onAccountSelected = (account: AccountLike, parentAccount?: AccountLike) => {
  const accountCurrency = getAccountCurrency(account);

  const confirmationParams = {
    parentId: parentAccount?.id,
    currency: accountCurrency,
    accountId: (account.type !== "Account" && account?.parentId) || account.id,
  };

  // Navigate to ReceiveFunds > ReceiveConfirmation
  if (navigationRef.current) {
    navigationRef.current.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        ...confirmationParams,
        hideBackButton: true,
      },
    });
  }
};

/**
 * Handles modular drawer deeplinks (receive & add-account)
 * Opens the appropriate drawer via Redux and returns navigation state for Portfolio
 *
 * @param hostname - The deeplink hostname ("receive" or "add-account")
 * @param searchParams - URL search parameters containing optional currency
 * @param dispatch - Redux dispatch function
 * @param config - Navigation configuration for getStateFromPath
 * @returns Navigation state for Portfolio screen
 */
export function handleModularDrawerDeeplink(
  hostname: string,
  searchParams: URLSearchParams,
  dispatch: Dispatch,
  config: Parameters<typeof getStateFromPath>[1],
) {
  const currencyParam = searchParams.get("currency");
  const deeplinkSource = searchParams.get("deeplinkSource");
  const ajsPropSource = searchParams.get("ajs_prop_source");

  const currency = currencyParam ? findCryptoCurrencyByKeyword(currencyParam) : undefined;

  const baseConfig = {
    currencies: currency ? [currency.id] : undefined,
    source: deeplinkSource || ajsPropSource || "deeplink",
    areCurrenciesFiltered: !!currency,
  };

  if (hostname === "receive") {
    const callbackId = generateCallbackId();
    callbackRegistry.register(callbackId, onAccountSelected);

    dispatch(
      openModularDrawer({
        ...baseConfig,
        flow: "receive_flow",
        enableAccountSelection: true,
        callbackId,
      }),
    );
  } else if (hostname === "add-account") {
    dispatch(
      openModularDrawer({
        ...baseConfig,
        flow: "add-account",
      }),
    );
  }

  return getStateFromPath("portfolio", config);
}
