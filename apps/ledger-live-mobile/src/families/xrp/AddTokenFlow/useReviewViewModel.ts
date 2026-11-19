import { useCallback, useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { formatCurrencyUnit, parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { MAX_TRUST_LIMIT } from "@ledgerhq/live-common/families/xrp/logicPublic";
import { useGetIssuerFeeQuery } from "@ledgerhq/live-common/families/xrp/state-manager/api";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import { navigateToSwapTab } from "~/screens/Swap/navigation/navigateToSwapTab";
import { formatIssuerFee, makeChangeTrustTransaction } from "../utils";
import type { XrpAddTokenFlowParamList } from "./types";

export type Props = BaseComposite<
  StackNavigatorProps<XrpAddTokenFlowParamList, ScreenName.XrpAddTokenReview>
>;

export type InfoRow = "tokenType" | "transferFee" | "lockedAmount" | "rippling";

const ZERO_LIMIT = new BigNumber(0);

function readField(error: Error | undefined, field: string): string | undefined {
  const value = (error as Record<string, unknown> | undefined)?.[field];

  return typeof value === "string" ? value : undefined;
}

export function useReviewViewModel({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "xrp: account required");

  const { token, balanceLimit } = route.params;
  const isIou = token.tokenType === "iou";
  const unit = account.currency.units[0];

  const isMaximum = !balanceLimit || balanceLimit.isMaximum;
  const limit = useMemo(() => {
    if (!isIou) return ZERO_LIMIT;

    return balanceLimit ? new BigNumber(balanceLimit.limit) : MAX_TRUST_LIMIT;
  }, [balanceLimit, isIou]);

  const [isRippling, setIsRippling] = useState(false);
  const [isRipplingSheetOpen, setIsRipplingSheetOpen] = useState(false);
  const [infoRow, setInfoRow] = useState<InfoRow>();

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
    transaction: makeChangeTrustTransaction(bridge, account, token, limit, !isRippling),
  }));

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
      balanceLimit: { limit: limit.toFixed(), isMaximum },
    });
  }, [account.id, isMaximum, limit, navigation, token]);

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

  const reserveError = Object.values(status.warnings).find(
    error => error.name === "XrpReserveIncrease",
  );
  const lockedAmountText = readField(reserveError, "amount")?.match(/[\d.]+/)?.[0];
  const lockedAmount = lockedAmountText ? parseCurrencyUnit(unit, lockedAmountText) : undefined;

  return {
    token,
    isIou,
    isRippling,
    isRipplingSheetOpen,
    infoRow,
    lockedAmount,
    transferFeeText,
    onEditLimit,
    onChangeRippling,
    onGoToSwap,
    onContinue,
    accountAddress: account.freshAddress,
    currency: account.currency,
    estimatedFees: status.estimatedFees,
    errors: [...(bridgeError ? [bridgeError] : []), ...otherErrors],
    warnings: Object.values(status.warnings).filter(error => error !== reserveError),
    isContinueDisabled: bridgePending || statusErrors.length > 0 || !!bridgeError,
    isContinueLoading: bridgePending,
    notEnoughAmount: notEnoughXrp && readField(notEnoughXrp, "minimumAmount"),
    isNotEnoughXrp: !!notEnoughXrp,
    onOpenInfo: setInfoRow,
    onCloseInfo: () => setInfoRow(undefined),
    onOpenRipplingSheet: () => setIsRipplingSheetOpen(true),
    onCloseRipplingSheet: () => setIsRipplingSheetOpen(false),
    limitText: isMaximum
      ? t("xrp.tokenSettings.maximum")
      : formatCurrencyUnit(token.units[0], limit, { showCode: true }),
  };
}
