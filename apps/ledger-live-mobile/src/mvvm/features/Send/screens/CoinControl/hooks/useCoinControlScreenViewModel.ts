import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useCoinControlScreenViewModelCore } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlScreenViewModelCore";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { useCallback, useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { localeSelector } from "~/reducers/settings";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import { useTranslatedBridgeError } from "../../Recipient/hooks/useTranslatedBridgeError";

type UseCoinControlScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
}>;

export function useCoinControlScreenViewModel({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
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

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
  });

  const amountErrorTranslated = useTranslatedBridgeError(
    status.errors?.amount || status.errors?.dustLimit,
  );
  const isAmountRequiredError = status.errors?.amount?.name === "AmountRequired";
  const amountError =
    amountErrorTranslated && !isAmountRequiredError ? amountErrorTranslated.title : undefined;

  const onLearnMoreClick = useCallback(() => {
    // TODO: Add link to coin control learn more
  }, []);

  const labels = useMemo(
    () => ({
      reviewCta: t("send.newSendFlow.reviewCta"),
      getCtaLabel: (currency: string) => t("send.newSendFlow.getCta", { currency }),
      strategyLabel: t("send.newSendFlow.coinControl.strategy"),
      learnMoreLabel: t("send.newSendFlow.coinControl.learnMore"),
      coinToSendLabel: t("send.newSendFlow.coinControl.coinToSend"),
      changeToReturnLabel: t("send.newSendFlow.coinControl.changeToReturn"),
      enterAmountPlaceholder: t("send.newSendFlow.coinControl.enterAmount"),
      amountToSendLabel: t("send.newSendFlow.coinControl.amountToSendInCurrency", {
        ticker: accountCurrency?.ticker ?? "CRYPTO",
      }),
      amountInputLabel: t("send.newSendFlow.coinControl.amountInputLabel"),
      getStrategyOptionLabel: (labelKey: string) => t(`send.newSendFlow.coinControl.${labelKey}`),
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

  return {
    ...core,
    coinControlStrategyLabel: core.strategyLabel,
    networkFees: core.networkFees,
  };
}
