import { useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useFlowWizard } from "LLD/features/FlowWizard/FlowWizardContext";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import {
  SEND_FLOW_STEP,
  type SendFlowTransactionActions,
  type SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import { trackPage } from "~/renderer/analytics/segment";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";
import { openURL } from "~/renderer/linking";

type AmountScreenViewModelBase = Readonly<{
  onReview: () => void;
  onGetFunds: () => void;
  onSelectCoinControl: () => void;
  onMessageLinkPress: (link: string) => void;
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
  const { navigation } = useFlowWizard();
  const navigate = useNavigate();
  const location = useLocation();
  const { account, parentAccount } = state.account;
  const { bridgePending, bridgeError, status, transaction } = state.transaction;

  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(account, parentAccount ?? null),
    [account, parentAccount],
  );

  const isReady = Boolean(account && transaction && status && uiConfig && transactionActions);

  const hasTrackedRef = useRef(false);
  if (!hasTrackedRef.current && isReady) {
    hasTrackedRef.current = true;
    trackPage("Modal send - step amount", null, trackingProperties);
  }

  const onGetFunds = useCallback(() => {
    if (!account) return;
    const mainAccount = getMainAccount(account, parentAccount ?? undefined);
    const currencyId = "currency" in mainAccount ? mainAccount.currency.id : undefined;

    navigate("/exchange", {
      state: {
        currency: currencyId,
        account: mainAccount.id,
        mode: "buy",
        returnTo: location.pathname,
      },
    });
    close();
  }, [account, close, navigate, parentAccount, location.pathname]);

  const onMessageLinkPress = useCallback(
    (link: string) => {
      if (link.startsWith("/")) {
        const url = new URL(link, "ledgerlive://local");
        navigate(url.pathname, {
          state: Object.fromEntries(url.searchParams.entries()),
        });
        close();
        return;
      }

      let url: URL;
      try {
        url = new URL(link);
      } catch {
        return;
      }

      if (url.protocol === "ledgerlive:" || url.protocol === "ledgerwallet:") {
        const state = Object.fromEntries(url.searchParams.entries());

        if (url.host === "buy") {
          const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : null;
          const currencyId =
            mainAccount && "currency" in mainAccount ? mainAccount.currency.id : undefined;

          navigate("/exchange", {
            state: {
              ...(currencyId ? { currency: currencyId } : {}),
              ...(mainAccount ? { account: mainAccount.id } : {}),
              ...state,
              mode: "buy",
              returnTo: location.pathname,
            },
          });
        } else {
          navigate(`/${url.host}${url.pathname}`, { state });
        }

        close();
        return;
      }

      if (url.protocol === "http:" || url.protocol === "https:") {
        openURL(link);
      }
    },
    [account, close, location.pathname, navigate, parentAccount],
  );

  const onReview = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.SIGNATURE);
  }, [navigation]);

  const onSelectCoinControl = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.COIN_CONTROL);
  }, [navigation]);

  if (!account || !transaction || !status || !uiConfig || !transactionActions) {
    return { ready: false, onReview, onGetFunds, onSelectCoinControl, onMessageLinkPress };
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
    onMessageLinkPress,
  };
}
