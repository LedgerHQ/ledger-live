import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { ScreenName } from "~/const";
import type { SendFlowNavigationProp } from "../../../types";
import { useSendSignature } from "../../../context/SendSignatureContext";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";
import { useAnalytics } from "~/analytics";

type AmountScreenViewModelBase = Readonly<{
  onReview: () => void;
  onGetFunds: () => void;
  onSelectCoinControl: () => void;
  onSelectCustomFees: () => void;
}>;

export type AmountScreenViewModel =
  | (AmountScreenViewModelBase & { ready: false })
  | (AmountScreenViewModelBase &
      Readonly<{
        ready: true;
        account: AccountLike;
        parentAccount: Account | null;
        transaction: Transaction;
        status: TransactionStatus;
        bridgePending: boolean;
        bridgeError: Error | null;
        uiConfig: SendFlowUiConfig;
        transactionActions: SendFlowTransactionActions;
      }>);

export function useAmountScreen(): AmountScreenViewModel {
  const { state, uiConfig } = useSendFlowData();
  const { transaction: transactionActions, close } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();
  const { startSigning } = useSendSignature();

  const { account, parentAccount } = state.account;
  const { bridgePending, bridgeError, status, transaction } = state.transaction;

  const onGetFunds = useCallback(() => {
    close();
  }, [close]);

  const { track } = useAnalytics();
  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(account, parentAccount);
  }, [account, parentAccount]);

  const onReview = useCallback(() => {
    track("button_clicked", { ...trackingProperties, button: "review", page: "step amount" });
    startSigning(() => navigation.navigate(ScreenName.SendFlowConfirmation));
  }, [startSigning, navigation, track, trackingProperties]);

  const onSelectCoinControl = useCallback(() => {
    navigation.navigate(ScreenName.SendFlowCoinControl);
  }, [navigation]);

  const onSelectCustomFees = useCallback(() => {
    navigation.navigate(ScreenName.SendFlowCustomFees);
  }, [navigation]);

  if (!account || !transaction || !status || !uiConfig || !transactionActions) {
    return { ready: false, onReview, onGetFunds, onSelectCoinControl, onSelectCustomFees };
  }

  return {
    ready: true,
    account,
    parentAccount: parentAccount ?? null,
    transaction,
    status,
    bridgePending: bridgePending ?? false,
    bridgeError: bridgeError ?? null,
    uiConfig,
    transactionActions,
    onReview,
    onGetFunds,
    onSelectCoinControl,
    onSelectCustomFees,
  };
}
