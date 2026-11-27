import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useLocation } from "react-router";
import type { Account } from "@ledgerhq/types-live";
import {
  dismissStakePosition,
  releaseStakePosition,
  settleStakePosition,
  useIsStakePositionShown,
  useShownStakePosition,
  type ShownStakePosition,
  type ShownStakePositionRequest,
} from "@features/flow-stake-position";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useNavigateToStakeForAccount } from "LLD/hooks/useNavigateToStakeForAccount";
import { useLLDCoinFamily } from "~/renderer/families";
import type { StakePositionDialogContentProps } from "~/renderer/families/types";
import { accountSelector } from "~/renderer/reducers/accounts";
import { closeStakePositionDialog, openStakePositionDialog } from "../stakePositionDialog";

export type StakePositionDialogRootViewModel =
  | Readonly<{ kind: "hidden" }>
  | Readonly<{
      kind: "position";
      Content: ComponentType<StakePositionDialogContentProps<Account>>;
      account: Account;
      request: ShownStakePositionRequest;
      phase: ShownStakePosition["phase"];
      onEarnMore: () => void;
    }>
  | Readonly<{
      kind: "accountRemoved";
      isOpen: boolean;
      ticker: string;
      currencyName: string;
      onDismiss: () => void;
      onHidden: () => void;
    }>;

/** Mirrors the request in the dialogs slice, so the app knows a global dialog is open. */
function useStakePositionDialogFlag() {
  const dispatch = useDispatch();
  const isShown = useIsStakePositionShown();

  useEffect(() => {
    if (!isShown) return;
    dispatch(openStakePositionDialog());
    return () => {
      dispatch(closeStakePositionDialog());
    };
  }, [dispatch, isShown]);
}

/** The device step can leave for the Manager or the onboarding: the dialog must not cover them. */
function useDismissOnNavigation(requestId: number | undefined) {
  const { pathname } = useLocation();
  const openedOn = useRef<Readonly<{ requestId: number; pathname: string }> | null>(null);

  useEffect(() => {
    if (requestId === undefined) return;
    if (openedOn.current?.requestId !== requestId) {
      openedOn.current = { requestId, pathname };
      return;
    }
    if (openedOn.current.pathname !== pathname) dismissStakePosition(requestId);
  }, [pathname, requestId]);
}

/** The request's account, kept after it leaves the wallet so a signed exit can still finish. */
function useRequestAccount(accountId: string | undefined) {
  const walletAccount = useSelector(state =>
    accountId ? accountSelector(state, { accountId }) : undefined,
  );
  const [lastAccount, setLastAccount] = useState(walletAccount);
  if (walletAccount && walletAccount !== lastAccount) setLastAccount(walletAccount);

  const knownAccount = lastAccount?.id === accountId ? lastAccount : undefined;
  return { account: walletAccount ?? knownAccount, isInWallet: walletAccount !== undefined };
}

/**
 * The account can leave the wallet while the handler loads its family: the request then targets an
 * account the dialog never cached, which it cannot show. It is dismissed, or its call is never
 * answered and the dialog flag stays open. A committed or settled request keeps its own flow.
 */
function useDismissRequestWithoutAccount(
  requestId: number | undefined,
  phase: ShownStakePosition["phase"],
  hasAccount: boolean,
) {
  const isUnsigned = phase === "open" || phase === "signing";
  useEffect(() => {
    if (requestId !== undefined && isUnsigned && !hasAccount) dismissStakePosition(requestId);
  }, [hasAccount, isUnsigned, requestId]);
}

export function useStakePositionDialogRootViewModel(): StakePositionDialogRootViewModel {
  const { request, phase } = useShownStakePosition();
  const { account, isInWallet } = useRequestAccount(request?.accountId);
  const { StakePositionDialogContent } = useLLDCoinFamily(account?.currency.family);
  const { navigateToStakeForAccount } = useNavigateToStakeForAccount();
  useStakePositionDialogFlag();
  useDismissOnNavigation(request?.id);
  useDismissRequestWithoutAccount(request?.id, phase, account !== undefined);

  // The Earn live app opens its own deposit flow from the answer; a wallet screen has the host do it.
  const onEarnMore = useCallback(() => {
    if (!request || !account) return;
    settleStakePosition(request.id, "earnMore");
    dismissStakePosition(request.id);
    if (request.origin !== "earn") {
      navigateToStakeForAccount(account, undefined, { source: "stake_position" });
    }
  }, [account, navigateToStakeForAccount, request]);

  const onDismiss = useCallback(() => {
    if (request) dismissStakePosition(request.id);
  }, [request]);

  const onHidden = useCallback(() => {
    if (request) releaseStakePosition(request.id);
  }, [request]);

  if (!request || !account || !StakePositionDialogContent) return { kind: "hidden" };

  const isSigned = phase === "committed" || phase === "settled";
  if (!isInWallet && !isSigned) {
    return {
      kind: "accountRemoved",
      isOpen: phase !== "closed",
      ticker: account.currency.ticker,
      currencyName: account.currency.name,
      onDismiss,
      onHidden,
    };
  }

  return {
    kind: "position",
    Content: StakePositionDialogContent,
    account,
    request,
    phase,
    onEarnMore,
  };
}
