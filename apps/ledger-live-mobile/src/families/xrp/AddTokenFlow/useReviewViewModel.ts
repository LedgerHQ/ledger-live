import { useCallback, useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { MAX_TRUST_LIMIT, isMaxTrustLimit } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import {
  formatIssuerFee,
  getMinimumAmount,
  makeChangeTrustTransaction,
} from "@ledgerhq/live-common/families/xrp/tokens";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import { navigateToSwapTab } from "~/screens/Swap/navigation/navigateToSwapTab";
import { useSignAndBroadcast } from "../components/SignAndBroadcast/useSignAndBroadcast";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenReview>
>;

const ZERO_LIMIT = new BigNumber(0);

function readErrorField(error: Error | undefined, field: string): string | undefined {
  const value = (error as Record<string, unknown> | undefined)?.[field];

  return typeof value === "string" ? value : undefined;
}

export function useReviewViewModel({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { account } = useAccountScreen(route);
  invariant(
    account?.type === "Account",
    "The XRP add token review needs a main account, not a token account",
  );

  const { token, balanceLimit } = route.params;
  const isIou = token.tokenType === "iou";
  const unit = account.currency.units[0];

  const limit = useMemo(() => {
    if (!isIou) return ZERO_LIMIT;

    return balanceLimit ? new BigNumber(balanceLimit.limit) : MAX_TRUST_LIMIT;
  }, [balanceLimit, isIou]);
  const isMaximum = isMaxTrustLimit(limit);

  const [isRippling, setIsRippling] = useState(false);
  const [isRipplingSheetOpen, setIsRipplingSheetOpen] = useState(false);

  const bridge = useAccountBridge<Transaction>(account);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    return {
      account,
      transaction: makeChangeTrustTransaction(bridge, account, {
        token,
        limit,
        noRipple: !isRippling,
      }),
    };
  });

  const { transaction, status, bridgeError, bridgePending } = bridgeTransaction;
  const { updateAccount, updateTransaction } = bridgeTransaction;
  const bridgeAccount = bridgeTransaction.account;

  useEffect(() => {
    if (bridgeAccount === account) return;

    updateAccount(account);
    updateTransaction(tx => ({ ...tx }));
  }, [account, bridgeAccount, updateAccount, updateTransaction]);

  useEffect(() => {
    updateTransaction(tx => bridge.updateTransaction(tx, { amount: limit, noRipple: !isRippling }));
  }, [bridge, isRippling, limit, updateTransaction]);

  const issuerFee = useGetIssuerFeeQuery(token, { refetchOnReconnect: true });
  const transferFeeText = (() => {
    if (issuerFee.isError) return t("xrp.manageAssets.transferFeeUnavailable");
    if (!issuerFee.data) return undefined;

    return t("xrp.addToken.steps.review.transferFeeValue", {
      fee: formatIssuerFee(issuerFee.data, locale),
    });
  })();

  const onEditLimit = useCallback(() => {
    navigation.navigate(ScreenName.XrpAddTokenBalanceLimit, {
      token,
      accountId: account.id,
      balanceLimit: { limit: limit.toFixed() },
    });
  }, [account.id, limit, navigation, token]);

  const onChangeRippling = useCallback((value: boolean) => {
    setIsRippling(value);
    setIsRipplingSheetOpen(false);
  }, []);

  const onGoToSwap = useCallback(() => {
    navigateToSwapTab({
      navigation,
      params: { toCurrencyId: account.currency.id, toAccountId: account.id },
    });
  }, [account, navigation]);

  const onSuccess = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: ScreenName.XrpAddTokenConfirmation, params: { accountId: account.id } }],
    });
  }, [account.id, navigation]);

  const signAndBroadcast = useSignAndBroadcast({
    action: "add",
    account,
    token,
    transaction,
    onSuccess,
  });

  const statusErrors = Object.values(status.errors);
  const notEnoughBalanceError = statusErrors.find(
    error => error.name === "NotEnoughSpendableBalance",
  );
  const otherErrors = statusErrors.filter(error => error !== notEnoughBalanceError);

  const statusWarnings = Object.values(status.warnings);
  const reserveError = statusWarnings.find(error => error.name === "XrpReserveIncrease");
  const lockedAmountText = readErrorField(reserveError, "amount")?.match(/[\d.]+/)?.[0];
  const lockedAmount = lockedAmountText ? parseCurrencyUnit(unit, lockedAmountText) : undefined;

  const hasNoError = statusErrors.length === 0 && !bridgeError;
  const isReadyToSign = !bridgePending && hasNoError;
  const isSignFlowRunning = signAndBroadcast.isSigning || signAndBroadcast.isBroadcasting;
  const onSignWhenReady = isReadyToSign ? signAndBroadcast.onSign : signAndBroadcast.onClose;

  return {
    token,
    isIou,
    isRippling,
    isRipplingSheetOpen,
    lockedAmount,
    transferFeeText,
    onEditLimit,
    onChangeRippling,
    onGoToSwap,
    onContinue: signAndBroadcast.onSign,
    accountId: account.id,
    accountAddress: account.freshAddress,
    currency: account.currency,
    estimatedFees: status.estimatedFees,
    errors: [...(bridgeError ? [bridgeError] : []), ...otherErrors],
    warnings: statusWarnings.filter(error => error !== reserveError),
    isContinueDisabled: !isReadyToSign || isSignFlowRunning,
    isContinueLoading: bridgePending || signAndBroadcast.isBroadcasting,
    notEnoughAmount: notEnoughBalanceError && getMinimumAmount(notEnoughBalanceError),
    isNotEnoughBalance: !!notEnoughBalanceError,
    onOpenRipplingSheet: () => setIsRipplingSheetOpen(true),
    onCloseRipplingSheet: () => setIsRipplingSheetOpen(false),
    limitText: isMaximum
      ? t("xrp.tokenSettings.maximum")
      : formatCurrencyUnit(token.units[0], limit, { showCode: true, locale }),
    signAndBroadcast: { ...signAndBroadcast, onSign: onSignWhenReady },
  };
}
