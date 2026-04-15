import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { useCoinControlScreenViewModelCore } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlScreenViewModelCore";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { useCallback, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";
import { useInitialTransactionPreparation } from "../../../hooks/useInitialTransactionPreparation";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { useTranslatedBridgeError } from "../../Recipient/hooks/useTranslatedBridgeError";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";

type UseCoinControlScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
}>;

export function useCoinControlScreenViewModel({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  bridgeError: _bridgeError,
  uiConfig,
  transactionActions,
}: UseCoinControlScreenViewModelParams) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];

  const rawTransactionAmount = transaction.amount ?? new BigNumber(0);
  const hasRawAmount = transaction.useAllAmount || rawTransactionAmount.gt(0);
  const shouldPrepare = Boolean(transaction.recipient) && hasRawAmount;

  useInitialTransactionPreparation({
    shouldPrepare,
    mainAccountId: mainAccount.id,
    recipientAddress: transaction.recipient ?? "",
    bridgePending,
    updateTransactionWithPatch: () => transactionActions.updateTransaction(tx => ({ ...tx })),
  });

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
  });

  const amountErrorTranslated = useTranslatedBridgeError(
    status.errors?.amount ?? status.errors?.dustLimit,
  );
  const isAmountRequiredError = status.errors?.amount?.name === "AmountRequired";
  const amountError =
    amountErrorTranslated && !isAmountRequiredError ? amountErrorTranslated.title : undefined;

  const onLearnMoreClick = useCallback(() => {
    openURL(urls.coinControl);
  }, []);

  const labels = useMemo(
    () => ({
      reviewCta: t("newSendFlow.reviewCta"),
      getCtaLabel: (currency: string) => t("newSendFlow.getCta", { currency }),
      strategyLabel: t("newSendFlow.coinControl.strategy"),
      learnMoreLabel: t("newSendFlow.coinControl.learnMore"),
      coinToSendLabel: t("newSendFlow.coinControl.coinToSend"),
      changeToReturnLabel: t("newSendFlow.coinControl.changeToReturn"),
      enterAmountPlaceholder: t("newSendFlow.coinControl.enterAmount"),
      selectSufficientCoinsPlaceholder: t("newSendFlow.coinControl.selectSufficientCoins"),
      amountToSendLabel: t("newSendFlow.coinControl.amountToSendInCurrency", {
        ticker: accountCurrency?.ticker ?? "CRYPTO",
      }),
      amountInputLabel: t("newSendFlow.coinControl.amountInputLabel"),
      getStrategyOptionLabel: (labelKey: string) => t(labelKey),
    }),
    [t, accountCurrency?.ticker],
  );

  const core = useCoinControlScreenViewModelCore({
    account,
    parentAccount,
    transaction,
    status,
    bridgePending,
    uiConfig,
    transactionActions,
    locale,
    accountUnit,
    amountError,
    networkFees,
    labels,
    onLearnMoreClick,
  });

  return core;
}
