import type { NavigatorScreenParams } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { selectFeature } from "@shared/feature-flags";
import type { Account } from "@ledgerhq/types-live";
import { resolveReceiveRoute, type GetReceiveFamilyConfig } from "@features/flow-receive";
import { NavigatorName, ScreenName } from "~/const";
import receiveAddressConfigs from "~/generated/ReceiveAddressConfig";
import type { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import type { ReceiveNavigatorParamList } from "~/components/RootNavigator/types/ReceiveNavigator";
import { accountsSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";

// Each family's config reads its own account type; the routing gives it the account of its family.
const familyConfigs = receiveAddressConfigs as Partial<
  Record<string, GetReceiveFamilyConfig<Account>>
>;

export type ReceiveConfirmationParams = ReceiveFundsStackParamList[ScreenName.ReceiveConfirmation];
/** The navigator to open and its params, for `navigation.navigate(...route)`. */
export type ReceiveRoute =
  | [NavigatorName.ReceiveFunds, NavigatorScreenParams<ReceiveFundsStackParamList>]
  | [NavigatorName.Receive, NavigatorScreenParams<ReceiveNavigatorParamList>];

/**
 * Single routing rule of the receive flow on mobile: every entry point builds the
 * `ReceiveConfirmation` params and navigates to the route returned here.
 * - `newReceiveFlow` on, account known to the account model and family supported: the `Receive`
 *   navigator on the account and the asset to receive;
 * - otherwise, or when the entry asks to create the token account: `ReceiveFunds` >
 *   `ReceiveConfirmation`, unchanged.
 */
export function getReceiveRoute(params: ReceiveConfirmationParams, state: State): ReceiveRoute {
  const legacy: ReceiveRoute = [
    NavigatorName.ReceiveFunds,
    { screen: ScreenName.ReceiveConfirmation, params },
  ];
  const flag = selectFeature(state, "newReceiveFlow");
  // The legacy screen adds the token account it is asked to create; the new flow stores none yet.
  if (!flag?.enabled || params.createTokenAccount) return legacy;

  const accounts = accountsSelector(state);
  const mainAccount =
    accounts.find(({ id }) => id === params.parentId) ??
    accounts.find(({ id }) => id === params.accountId) ??
    accounts.find(({ subAccounts }) => subAccounts?.some(({ id }) => id === params.accountId));
  if (!mainAccount) return legacy;

  const tokenAccount = mainAccount.subAccounts?.find(({ id }) => id === params.accountId);
  const asset =
    params.currency?.type === "CryptoCurrency" || params.currency?.type === "TokenCurrency"
      ? params.currency
      : getAccountCurrency(tokenAccount ?? mainAccount);
  const family = mainAccount.currency.family;
  const target = resolveReceiveRoute({
    flag,
    accounts: state.accountEntries,
    legacyAccountId: mainAccount.id,
    asset,
    family,
    familyConfig: familyConfigs[family],
    featureFlags: state.featureFlags.resolved,
    legacyAccount: mainAccount,
  });
  if (!target) return legacy;

  return [
    NavigatorName.Receive,
    {
      screen: ScreenName.ReceiveAddress,
      params: { accountUUID: target.accountUUID, assetId: target.assetId },
    },
  ];
}
