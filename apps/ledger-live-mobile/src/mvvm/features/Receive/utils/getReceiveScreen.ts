import type { NavigatorScreenParams } from "@react-navigation/native";
import { selectFeature } from "@shared/feature-flags";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { ScreenName } from "~/const";
import { accountsSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";
import type { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { getReceiveFamilyTraits } from "./getReceiveFamilyConfig";
import { selectAccountEntry, selectAccountUUIDOfLegacyAccount } from "./receiveAccount";

export type ReceiveConfirmationParams = ReceiveFundsStackParamList[ScreenName.ReceiveConfirmation];
export type ReceiveScreen = NavigatorScreenParams<ReceiveFundsStackParamList>;

/**
 * Single routing rule of the receive flow on mobile: every entry point builds the legacy
 * `ReceiveConfirmation` params and navigates to `ReceiveFunds` with the screen returned here.
 * - `newReceiveFlow` on and the family supported: the new `ReceiveAddress` screen, on the account
 *   entry with the asset to receive (a token account may not exist yet). It reads the `receive`
 *   account data and comes back to `ReceiveConfirmation` if the account cannot receive there yet;
 * - otherwise: `ReceiveConfirmation`, unchanged.
 */
export function getReceiveScreen(params: ReceiveConfirmationParams, state: State): ReceiveScreen {
  const legacy: ReceiveScreen = { screen: ScreenName.ReceiveConfirmation, params };
  const flag = selectFeature(state, "newReceiveFlow");
  if (!flag?.enabled) return legacy;

  const accounts = accountsSelector(state);
  const mainAccount =
    accounts.find(account => account.id === params.parentId) ??
    accounts.find(account => account.id === params.accountId) ??
    accounts.find(account => account.subAccounts?.some(sub => sub.id === params.accountId));
  if (!mainAccount) return legacy;

  const tokenAccount = mainAccount.subAccounts?.find(sub => sub.id === params.accountId);
  const currency =
    params.currency?.type === "CryptoCurrency" || params.currency?.type === "TokenCurrency"
      ? params.currency
      : getAccountCurrency(tokenAccount ?? mainAccount);

  const accountUUID = selectAccountUUIDOfLegacyAccount(state, mainAccount.id);
  const entry = accountUUID && selectAccountEntry(state, accountUUID);
  if (!entry) return legacy;

  const { isSupported } = getReceiveFamilyTraits({
    family: mainAccount.currency.family,
    descriptor: entry.descriptor,
    asset: currency,
    featureFlags: state.featureFlags.resolved,
    legacyAccount: mainAccount,
    excludedFamilies: flag.params?.excludedFamilies,
  });
  if (!isSupported) return legacy;

  return {
    screen: ScreenName.ReceiveAddress,
    params: {
      accountUUID: entry.accountUUID,
      assetId: CryptoOrTokenCurrencyIdSchema.parse(currency.id),
      legacyParams: params,
    },
  };
}
