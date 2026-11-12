import { useCallback, useEffect } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { makeChangeTrustTransaction } from "../utils";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenReview>
>;

function readField(error: Error | undefined, field: string): string | undefined {
  const value = (error as Record<string, unknown> | undefined)?.[field];

  return typeof value === "string" ? value : undefined;
}

export function useReviewViewModel({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { token, settings } = route.params;

  const bridge = useAccountBridge<Transaction>(account);
  const {
    transaction,
    status,
    bridgeError,
    bridgePending,
    account: bridgeAccount,
    updateAccount,
    updateTransaction,
  } = useBridgeTransaction<Transaction>(bridge, () => ({
    account,
    transaction: makeChangeTrustTransaction(
      bridge,
      account,
      token,
      settings?.limit ?? new BigNumber(0),
    ),
  }));

  useEffect(() => {
    if (bridgeAccount === account) return;

    updateAccount(account);
    updateTransaction(tx => ({ ...tx }));
  }, [account, bridgeAccount, updateAccount, updateTransaction]);

  const { isCurrencyAvailable } = useRampCatalog();

  const onReceive = useCallback(() => {
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: { accountId: account.id, currency: account.currency },
    });
  }, [account, navigation]);

  const onBuy = useCallback(() => {
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: { defaultCurrencyId: account.currency.id, defaultAccountId: account.id },
    });
  }, [account, navigation]);

  const onContinue = useCallback(() => {
    if (!transaction) return;

    navigation.navigate(ScreenName.XrpAddTokenSelectDevice, {
      token,
      transaction,
      status,
      accountId: account.id,
    });
  }, [account.id, navigation, status, token, transaction]);

  const statusErrors = Object.values(status.errors);
  const notEnoughXrp = statusErrors.find(error => error.name === "NotEnoughSpendableBalance");
  const otherErrors = statusErrors.filter(error => error !== notEnoughXrp);

  return {
    token,
    settings,
    onReceive,
    onBuy,
    onContinue,
    isIou: token.tokenType === "iou",
    accountAddress: account.freshAddress,
    accountUnit: account.currency.units[0],
    estimatedFees: status.estimatedFees,
    errors: [...(bridgeError ? [bridgeError] : []), ...otherErrors],
    warnings: Object.values(status.warnings),
    canBuy: isCurrencyAvailable(account.currency.id, "onRamp"),
    isContinueDisabled: bridgePending || statusErrors.length > 0 || !!bridgeError,
    isContinueLoading: bridgePending,
    notEnoughXrp: notEnoughXrp && {
      minimumAmount: readField(notEnoughXrp, "minimumAmount"),
      lockedAmount: readField(status.warnings.reserve, "amount"),
    },
  };
}
