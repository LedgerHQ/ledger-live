import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { findSolanaStakingPosition } from "@ledgerhq/live-common/families/solana/logic";
import { getApyAppearance } from "@ledgerhq/live-common/modularDrawer/utils/getApyAppearance";
import type {
  SolanaAccount,
  SolanaStakingPosition,
  Transaction,
} from "@ledgerhq/live-common/families/solana/types";
import type { Operation, ResolvedAccountBridge } from "@ledgerhq/types-live";
import {
  answerStakePositionUnavailable,
  dismissStakePosition,
  getExitAction,
  getExitAmount,
  getStakePositionValidatorName,
  releaseStakePosition,
  reopenStakePosition,
  startSigningStakePosition,
  toChainExit,
  toStakePositionDetailsProps,
  useStakePositionData,
  useStakePositionSteps,
  useStakePositionTracking,
  type ReadyStakePositionData,
  type StakePositionApyAppearance,
  type StakePositionData,
  type StakePositionDetailsProps,
  type StakePositionExitAction,
  type StakePositionFormatter,
  type StakePositionHeading,
  type StakePositionSnapshot,
  type StakePositionStep,
  type StakePositionTrackedButton,
  type StakePositionTrackedStep,
} from "@features/flow-stake-position";
import { openBuyDevice } from "LLD/features/BuyDevice/buyDeviceDialog";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { getParsedSystemDeviceLocale } from "~/helpers/systemLocale";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import type { StakePositionDialogContentProps } from "../../types";
import type { ExitTransactionStage, ExitTransactionStepProps } from "./ExitTransactionStep";
import type {
  StakePositionAccountCurrency,
  StakePositionDialogBody,
  StakePositionDialogContentViewProps,
} from "./StakePositionDialogContentView";
import { toStakePositionSnapshot } from "./toStakePositionSnapshot";
import { useStakePositionFormatter } from "./useStakePositionFormatter";
import { useStakePositionSyncOnOpen } from "./useStakePositionSyncOnOpen";

/** The exit as the user confirmed it: the device signs this one whatever the account becomes. */
type ExitToSign = Readonly<{
  transactionKey: string;
  account: SolanaAccount;
  position: SolanaStakingPosition;
  validatorName: string;
}>;

type DialogContent =
  | Readonly<{ view: "loading" | "notFound" }>
  | Readonly<{ view: "error"; retry: () => void }>
  | Readonly<{ view: "details"; data: ReadyStakePositionData; snapshot: StakePositionSnapshot }>
  | Readonly<{
      view: "transaction";
      exit: ExitToSign;
      action: StakePositionExitAction;
      stage: ExitTransactionStage;
    }>
  | Readonly<{ view: "success"; action: StakePositionExitAction }>
  | Readonly<{
      view: "failure";
      action: StakePositionExitAction;
      error: Error;
      isSigned: boolean;
    }>;

type ContentInputs = Readonly<{
  account: SolanaAccount;
  position: SolanaStakingPosition | undefined;
  snapshot: StakePositionSnapshot | undefined;
  data: StakePositionData;
  isSyncing: boolean;
  isClosed: boolean;
  liveTransactionKey: string;
  exitToSign: ExitToSign | null;
}>;

type BodyActions = Readonly<{
  requestId: number;
  bridge: ResolvedAccountBridge<Transaction>;
  ticker: string;
  accountName: string | undefined;
  accountCurrency: StakePositionAccountCurrency;
  format: StakePositionFormatter;
  apyAppearance: StakePositionApyAppearance;
  isSyncing: boolean;
  dismiss: () => void;
  earnMore: () => void;
  selectExitAction: (action: StakePositionExitAction) => void;
  confirmExit: () => void;
  markSigned: () => void;
  markBroadcasted: (operation: Operation) => void;
  markFailed: (error: Error) => void;
  viewTransaction?: () => void;
  retry: () => void;
  retryLoad: () => void;
}>;

const LOADING: DialogContent = { view: "loading" };
const DETAILS_HEADING: StakePositionHeading = { kind: "details" };

/** Changes whenever the exit transaction would: the confirmation then prepares it again. */
function revisionOf(account: SolanaAccount, snapshot: StakePositionSnapshot | undefined): string {
  if (!snapshot) return "";
  const { state, amount, withdrawableAmount, canStake, canWithdraw } = snapshot;
  return [
    state,
    amount,
    withdrawableAmount,
    canStake,
    canWithdraw,
    account.balance,
    account.spendableBalance,
  ].join(":");
}

/**
 * The position as the details show it: the backend reports it, the chain decides its exit. A
 * position the chain no longer holds once synced is not found, whatever the backend still says.
 */
function positionContentOf({ data, snapshot, isSyncing }: ContentInputs): DialogContent {
  switch (data.kind) {
    case "loading":
    case "unavailable":
      return LOADING;
    case "notFound":
      return { view: "notFound" };
    case "error":
      return { view: "error", retry: data.retry };
    case "ready":
      if (snapshot) return { view: "details", data, snapshot };
      return isSyncing ? LOADING : { view: "notFound" };
  }
}

function contentOf(step: StakePositionStep, inputs: ContentInputs): DialogContent {
  const { account, position, isClosed, liveTransactionKey, exitToSign } = inputs;
  switch (step.name) {
    case "details":
      return positionContentOf(inputs);
    case "confirm": {
      const details = positionContentOf(inputs);
      if (details.view !== "details" || !position) return details;
      return {
        view: "transaction",
        exit: {
          transactionKey: liveTransactionKey,
          account,
          position,
          validatorName: getStakePositionValidatorName(details.data.position),
        },
        action: step.action,
        stage: "confirm",
      };
    }
    case "signing":
      // The dialog stays mounted while it animates out: a signature must not start from there.
      if (isClosed || !exitToSign) return LOADING;
      return { view: "transaction", exit: exitToSign, action: step.action, stage: "signing" };
    case "broadcasting":
      if (!exitToSign) return LOADING;
      return { view: "transaction", exit: exitToSign, action: step.action, stage: "broadcasting" };
    case "success":
      return { view: "success", action: step.action };
    case "failure":
      return { view: "failure", action: step.action, error: step.error, isSigned: step.signed };
  }
}

function trackedStepOf(content: DialogContent): StakePositionTrackedStep | null {
  switch (content.view) {
    case "notFound":
      return { page: "unavailable", reason: "not_found" };
    case "error":
      return { page: "unavailable", reason: "load_error" };
    case "details":
      return { page: "details", positionStatus: content.data.status };
    case "transaction":
      return content.stage === "confirm" ? { page: "confirm", action: content.action } : null;
    case "success":
    case "failure":
      return { page: content.view, action: content.action };
    case "loading":
      return null;
  }
}

const pageKeyOf = (step: StakePositionTrackedStep | null) =>
  step && ("action" in step ? `${step.page}:${step.action}` : step.page);

/** Tracks each page once per visit, not each time the position it shows is updated. */
function useTrackStepOnEntry(
  trackedStep: StakePositionTrackedStep | null,
  trackStep: (step: StakePositionTrackedStep) => void,
) {
  const lastPageKey = useRef<string | null>(null);

  useEffect(() => {
    const pageKey = pageKeyOf(trackedStep);
    if (pageKey === lastPageKey.current) return;
    lastPageKey.current = pageKey;
    if (trackedStep) trackStep(trackedStep);
  }, [trackStep, trackedStep]);
}

function headingOf(content: DialogContent): StakePositionHeading {
  switch (content.view) {
    case "transaction":
      return { kind: "confirm", action: content.action };
    case "success":
    case "failure":
      return { kind: "result", outcome: content.view };
    default:
      return DETAILS_HEADING;
  }
}

function detailsPropsOf(
  { data, snapshot }: Extract<DialogContent, { view: "details" }>,
  actions: BodyActions,
): StakePositionDetailsProps {
  return {
    ...toStakePositionDetailsProps(data, toChainExit(snapshot, actions.isSyncing), actions.format),
    apyAppearance: actions.apyAppearance,
    ticker: actions.ticker,
    accountName: actions.accountName,
    onEarnMore: actions.earnMore,
    onSelectExitAction: actions.selectExitAction,
    testID: "stake-position-details",
  };
}

function transactionPropsOf(
  { exit, action, stage }: Extract<DialogContent, { view: "transaction" }>,
  actions: BodyActions,
): ExitTransactionStepProps {
  const exitAmount = getExitAmount(toStakePositionSnapshot(exit.position), action);
  return {
    requestId: actions.requestId,
    bridge: actions.bridge,
    account: exit.account,
    position: exit.position,
    action,
    stage,
    ticker: actions.ticker,
    amount: actions.format.amount(exitAmount.toString()).crypto,
    validatorName: exit.validatorName,
    accountName: actions.accountName,
    isSyncing: actions.isSyncing,
    onConfirm: actions.confirmExit,
    onCancel: actions.dismiss,
    onSigned: actions.markSigned,
    onBroadcasted: actions.markBroadcasted,
    onFailed: actions.markFailed,
  };
}

function bodyOf(content: DialogContent, actions: BodyActions): StakePositionDialogBody {
  switch (content.view) {
    case "loading":
    case "notFound":
      return { kind: content.view, onDismiss: actions.dismiss };
    case "error":
      return { kind: "error", onDismiss: actions.dismiss, onRetry: actions.retryLoad };
    case "details":
      return {
        kind: "details",
        details: detailsPropsOf(content, actions),
        accountCurrency: actions.accountCurrency,
      };
    case "transaction":
      return {
        kind: "transaction",
        transactionKey: content.exit.transactionKey,
        transaction: transactionPropsOf(content, actions),
      };
    case "success":
      return {
        kind: "success",
        result: {
          outcome: "success",
          action: content.action,
          ticker: actions.ticker,
          onViewTransaction: actions.viewTransaction,
          testID: "stake-position-success",
        },
      };
    case "failure":
      return {
        kind: "failure",
        error: content.error,
        isSigned: content.isSigned,
        onRetry: actions.retry,
      };
  }
}

/**
 * One SOL stake position, from its details to its full deactivation or withdrawal signed on the
 * device. Every figure of the details comes from the Earn backend; the account state builds,
 * gates and signs the exit, found by the stake account of the request.
 */
export function useSolanaStakePositionDialogViewModel({
  account,
  request,
  phase,
  onEarnMore,
}: StakePositionDialogContentProps<SolanaAccount>): StakePositionDialogContentViewProps {
  const dispatch = useDispatch();
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const bridge = useAccountBridge<Transaction>(account);
  const [step, dispatchStep] = useStakePositionSteps();
  const [exitToSign, setExitToSign] = useState<ExitToSign | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [operation, setOperation] = useState<Operation | null>(null);
  const isSyncing = useStakePositionSyncOnOpen(account);
  const format = useStakePositionFormatter(account);
  const { region } = getParsedSystemDeviceLocale();
  const apyAppearance = useMemo(() => getApyAppearance(region), [region]);
  const ticker = account.currency.ticker;
  const accountName = useMaybeAccountName(account);
  const { trackStep, trackButton } = useStakePositionTracking({ origin: request.origin, ticker });
  const requestId = request.id;
  const isClosed = phase === "closed";

  const data = useStakePositionData({
    request,
    isOpen: !isClosed,
    network: account.currency.id,
    ownerAddress: account.freshAddress,
  });
  const position = useMemo(
    () => findSolanaStakingPosition(account, request.positionId),
    [account, request.positionId],
  );
  const snapshot = useMemo(() => position && toStakePositionSnapshot(position), [position]);
  const exitAction = snapshot ? getExitAction(snapshot) : null;

  const shownContent = contentOf(step, {
    account,
    position,
    snapshot,
    data,
    isSyncing,
    isClosed,
    liveTransactionKey: `${attempt}:${revisionOf(account, snapshot)}`,
    exitToSign,
  });
  // The Earn live app shows its own menu for a position the host cannot show, instead of a dialog.
  const isUnavailableToEarn = request.origin === "earn" && shownContent.view === "notFound";
  const content = isUnavailableToEarn ? LOADING : shownContent;
  const trackedStep = isClosed ? null : trackedStepOf(content);
  const isFailure = content.view === "failure";

  useEffect(() => {
    if (isUnavailableToEarn) answerStakePositionUnavailable(requestId);
  }, [isUnavailableToEarn, requestId]);

  // A result has no close button of its own: a signing or signed request opens again, so the
  // header closes it and a new request is no longer refused.
  useEffect(() => {
    if (isFailure) reopenStakePosition(requestId);
  }, [isFailure, requestId]);

  useEffect(() => {
    if (step.name === "confirm" && step.action !== exitAction) dispatchStep({ type: "back" });
  }, [dispatchStep, exitAction, step]);

  useTrackStepOnEntry(trackedStep, trackStep);

  const trackPageButton = (button: StakePositionTrackedButton) => {
    if (!trackedStep) return;
    trackButton(button, trackedStep.page, "action" in trackedStep ? trackedStep.action : undefined);
  };

  const dismiss = () => {
    trackPageButton("close");
    dismissStakePosition(requestId);
  };

  const selectExitAction = (action: StakePositionExitAction) => {
    trackButton(action, "details", action);
    dispatchStep({ type: "selectExit", action });
  };

  const earnMore = () => {
    trackButton("earn_more", "details");
    onEarnMore();
  };

  const confirmExit = () => {
    // The sync may still change the position: the user confirms the exit of the synced one.
    if (content.view !== "transaction" || isSyncing) return;
    trackPageButton("confirm");
    if (!hasOnboardedDevice) {
      dismissStakePosition(requestId);
      setOriginFlow(HOOKS_TRACKING_LOCATIONS.stake);
      dispatch(openBuyDevice());
      return;
    }
    startSigningStakePosition(requestId);
    setExitToSign(content.exit);
    dispatchStep({ type: "confirm" });
  };

  const markSigned = useCallback(() => dispatchStep({ type: "signed" }), [dispatchStep]);
  const markBroadcasted = useCallback(
    (broadcasted: Operation) => {
      setOperation(broadcasted);
      dispatchStep({ type: "broadcasted" });
    },
    [dispatchStep],
  );
  const markFailed = useCallback(
    (error: Error) => dispatchStep({ type: "failed", error }),
    [dispatchStep],
  );

  const retry = () => {
    trackPageButton("try_again");
    setExitToSign(null);
    setAttempt(current => current + 1);
    dispatchStep({ type: "retry" });
  };

  const retryLoad = () => {
    if (content.view !== "error") return;
    trackPageButton("retry_load");
    content.retry();
  };

  const viewTransaction = operation
    ? () => {
        trackPageButton("view_transaction");
        dismissStakePosition(requestId);
        setDrawer(OperationDetails, { operationId: operation.id, accountId: account.id });
      }
    : undefined;

  const body = bodyOf(content, {
    requestId,
    bridge,
    ticker,
    accountName,
    accountCurrency: { ledgerId: account.currency.id, ticker },
    format,
    apyAppearance,
    isSyncing,
    dismiss,
    earnMore,
    selectExitAction,
    confirmExit,
    markSigned,
    markBroadcasted,
    markFailed,
    viewTransaction,
    retry,
    retryLoad,
  });

  return {
    surface: {
      isOpen: !isClosed,
      heading: headingOf(content),
      ticker,
      currencyName: account.currency.name,
      onDismiss: dismiss,
      onHidden: () => releaseStakePosition(requestId),
      isDismissible: phase !== "committed",
      testID: "stake-position-dialog",
    },
    body,
  };
}
