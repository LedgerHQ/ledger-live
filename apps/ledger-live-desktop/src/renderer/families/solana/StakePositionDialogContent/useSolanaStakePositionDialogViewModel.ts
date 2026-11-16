import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import {
  findSolanaStakingPosition,
  listSolanaStakingPositions,
  requireStakePositionId,
} from "@ledgerhq/live-common/families/solana/logic";
import type {
  SolanaAccount,
  SolanaStakingPosition,
  Transaction,
} from "@ledgerhq/live-common/families/solana/types";
import type { Operation, ResolvedAccountBridge } from "@ledgerhq/types-live";
import {
  abandonStakePosition,
  dismissStakePosition,
  getExitAction,
  getPositionNotice,
  reopenStakePosition,
  resolvePositionMatch,
  settleStakePositionUnavailable,
  useStakePositionSteps,
  useStakePositionTracking,
  type ShownStakePositionRequest,
  type StakePositionCandidate,
  type StakePositionDetailsProps,
  type StakePositionExitAction,
  type StakePositionHeading,
  type StakePositionStep,
  type StakePositionTrackedButton,
  type StakePositionTrackedStep,
} from "@features/flow-stake-position";
import { openBuyDevice } from "LLD/features/BuyDevice/buyDeviceDialog";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import type { StakePositionDialogContentProps } from "../../types";
import type { ExitTransactionStepProps } from "./ExitTransactionStep";
import type {
  StakePositionDialogBody,
  StakePositionDialogContentViewProps,
} from "./StakePositionDialogContentView";
import { useStakePositionDisplay, type StakePositionDisplay } from "./useStakePositionDisplay";
import { useStakePositionSyncOnOpen } from "./useStakePositionSyncOnOpen";

/** The exit as the user confirmed it: the device signs this one whatever the account becomes. */
type ExitToSign = Readonly<{
  transactionKey: string;
  account: SolanaAccount;
  position: SolanaStakingPosition;
  display: StakePositionDisplay;
}>;

type DialogContent =
  | Readonly<{ view: "loading" | "notFound" }>
  | Readonly<{ view: "details"; display: StakePositionDisplay; position: SolanaStakingPosition }>
  | Readonly<{
      view: "transaction";
      exit: ExitToSign;
      action: StakePositionExitAction;
      isOnDevice: boolean;
    }>
  | Readonly<{ view: "success"; action: StakePositionExitAction }>
  | Readonly<{ view: "failure"; error: Error; isSigned: boolean }>;

type ContentInputs = Readonly<{
  account: SolanaAccount;
  position: SolanaStakingPosition | undefined;
  display: StakePositionDisplay | null;
  isAmbiguous: boolean;
  isSyncing: boolean;
  isClosed: boolean;
  liveTransactionKey: string;
  exitToSign: ExitToSign | null;
}>;

type BodyActions = Readonly<{
  requestId: number;
  bridge: ResolvedAccountBridge<Transaction>;
  ticker: string;
  isSyncing: boolean;
  dismiss: () => void;
  earnMore: () => void;
  selectExitAction: (action: StakePositionExitAction) => void;
  confirmExit: () => void;
  markSigned: () => void;
  markBroadcasted: (operation: Operation) => void;
  markFailed: (error: Error) => void;
  viewDetails?: () => void;
  close: () => void;
  retry: () => void;
  abandon: () => void;
}>;

const DETAILS_HEADING: StakePositionHeading = { kind: "details" };

const EXIT_BUTTONS = {
  deactivate: "deactivate",
  withdraw: "withdraw_all",
} as const satisfies Record<StakePositionExitAction, StakePositionTrackedButton>;

const toCandidates = (account: SolanaAccount): StakePositionCandidate[] =>
  listSolanaStakingPositions(account.stakingResources).map(({ positionId, validatorAddress }) => ({
    positionId: positionId ?? "",
    validatorAddress,
  }));

function findRequestedPosition(
  account: SolanaAccount,
  { positionId, validatorAddress }: ShownStakePositionRequest,
): SolanaStakingPosition | undefined {
  const position = findSolanaStakingPosition(account, positionId);
  return position?.validatorAddress === validatorAddress ? position : undefined;
}

/** Changes whenever the exit transaction would: the confirmation then prepares it again. */
function revisionOf(account: SolanaAccount, display: StakePositionDisplay | null): string {
  if (!display) return "";
  const { state, amount, withdrawableAmount, canStake, canWithdraw } = display.snapshot;
  return [state, amount, withdrawableAmount, canStake, canWithdraw, account.spendableBalance].join(
    ":",
  );
}

function detailsContentOf({
  position,
  display,
  isAmbiguous,
  isSyncing,
}: ContentInputs): DialogContent {
  if (isAmbiguous || (!display && isSyncing)) return { view: "loading" };
  if (!display || !position) return { view: "notFound" };
  return { view: "details", display, position };
}

function contentOf(step: StakePositionStep, inputs: ContentInputs): DialogContent {
  const { account, position, display, isClosed, liveTransactionKey, exitToSign } = inputs;
  switch (step.name) {
    case "details":
      return detailsContentOf(inputs);
    case "confirm":
      if (!display || !position) return { view: "notFound" };
      return {
        view: "transaction",
        exit: { transactionKey: liveTransactionKey, account, position, display },
        action: step.action,
        isOnDevice: false,
      };
    case "signing":
      // The dialog stays mounted while it animates out: a signature must not start from there.
      if (isClosed || !exitToSign) return { view: "loading" };
      return { view: "transaction", exit: exitToSign, action: step.action, isOnDevice: true };
    case "broadcasting":
      if (!exitToSign) return { view: "loading" };
      return { view: "transaction", exit: exitToSign, action: step.action, isOnDevice: true };
    case "success":
      return { view: "success", action: step.action };
    case "failure":
      return { view: "failure", error: step.error, isSigned: step.signed };
  }
}

function trackedStepOf(content: DialogContent): StakePositionTrackedStep | null {
  switch (content.view) {
    case "notFound":
      return { page: "notFound" };
    case "details":
      return { page: "details", positionStatus: content.display.snapshot.state };
    case "transaction":
      return content.isOnDevice ? null : { page: "confirm", action: content.action };
    default:
      return null;
  }
}

const pageKeyOf = (step: StakePositionTrackedStep | null) =>
  step && (step.page === "confirm" ? `confirm:${step.action}` : step.page);

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

function detailsPropsOf(
  { display, position }: Extract<DialogContent, { view: "details" }>,
  actions: BodyActions,
): StakePositionDetailsProps {
  return {
    ticker: actions.ticker,
    state: display.snapshot.state,
    balance: display.balance,
    rewards: display.rewards,
    apy: display.apy,
    validator: display.validator,
    address: requireStakePositionId(position),
    exitAction: getExitAction(display.snapshot),
    notice: getPositionNotice(display.snapshot),
    isExitActionPending: actions.isSyncing,
    onEarnMore: actions.earnMore,
    onSelectExitAction: actions.selectExitAction,
    testID: "stake-position-details",
  };
}

function transactionPropsOf(
  { exit, action, isOnDevice }: Extract<DialogContent, { view: "transaction" }>,
  actions: BodyActions,
): ExitTransactionStepProps {
  return {
    requestId: actions.requestId,
    bridge: actions.bridge,
    account: exit.account,
    position: exit.position,
    action,
    isOnDevice,
    ticker: actions.ticker,
    amount: exit.display.exitAmount(action),
    validatorName: exit.display.validator.name,
    formatFees: exit.display.formatFees,
    onConfirm: actions.confirmExit,
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
    case "details":
      return { kind: "details", details: detailsPropsOf(content, actions) };
    case "transaction":
      return {
        kind: "transaction",
        transactionKey: content.exit.transactionKey,
        transaction: transactionPropsOf(content, actions),
      };
    case "success":
      return {
        kind: "result",
        result: {
          kind: "success",
          action: content.action,
          onViewDetails: actions.viewDetails,
          onClose: actions.close,
        },
      };
    case "failure":
      return {
        kind: "result",
        result: {
          kind: "failure",
          error: content.error,
          isSigned: content.isSigned,
          onRetry: actions.retry,
          onClose: actions.abandon,
        },
      };
  }
}

/**
 * One SOL stake position, from its details to its full deactivation or withdrawal signed on the
 * device. The position is read from the account at each update, by the address the live app asked
 * for: the live app never provides what the transaction spends.
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
  const ticker = account.currency.ticker;
  const { trackStep, trackButton } = useStakePositionTracking({ origin: request.origin, ticker });
  const requestId = request.id;

  const candidates = useMemo(() => toCandidates(account), [account]);
  const isAmbiguous = resolvePositionMatch(candidates, request).kind === "ambiguous";
  const position = useMemo(() => findRequestedPosition(account, request), [account, request]);
  const display = useStakePositionDisplay(account, position, request.rewards);
  const exitAction = display && getExitAction(display.snapshot);
  const isClosed = phase === "closed";
  const content = contentOf(step, {
    account,
    position,
    display,
    isAmbiguous,
    isSyncing,
    isClosed,
    liveTransactionKey: `${attempt}:${revisionOf(account, display)}`,
    exitToSign,
  });
  const trackedStep = isClosed ? null : trackedStepOf(content);

  useEffect(() => {
    if (isAmbiguous && !isSyncing) settleStakePositionUnavailable(requestId, "ambiguous");
  }, [isAmbiguous, isSyncing, requestId]);

  useEffect(() => {
    if (step.name === "confirm" && step.action !== exitAction) dispatchStep({ type: "back" });
  }, [dispatchStep, exitAction, step]);

  useTrackStepOnEntry(trackedStep, trackStep);

  const trackPageButton = (button: StakePositionTrackedButton) => {
    if (!trackedStep) return;
    const action = trackedStep.page === "confirm" ? trackedStep.action : undefined;
    trackButton(button, trackedStep.page, action);
  };

  const dismiss = () => {
    trackPageButton("close");
    dismissStakePosition(requestId);
  };

  const selectExitAction = (action: StakePositionExitAction) => {
    trackButton(EXIT_BUTTONS[action], "details", action);
    dispatchStep({ type: "selectExit", action });
  };

  const earnMore = () => {
    trackButton("earn_more", "details");
    onEarnMore();
  };

  const goBack = () => {
    trackPageButton("back");
    dispatchStep({ type: "back" });
  };

  const confirmExit = () => {
    if (content.view !== "transaction") return;
    trackPageButton("confirm");
    if (!hasOnboardedDevice) {
      dismissStakePosition(requestId);
      setOriginFlow(HOOKS_TRACKING_LOCATIONS.stake);
      dispatch(openBuyDevice());
      return;
    }
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
    if (content.view === "failure" && content.isSigned) reopenStakePosition(requestId);
    setExitToSign(null);
    setAttempt(current => current + 1);
    dispatchStep({ type: "retry" });
  };

  const viewDetails = operation
    ? () => {
        dismissStakePosition(requestId);
        setDrawer(OperationDetails, { operationId: operation.id, accountId: account.id });
      }
    : undefined;

  const body = bodyOf(content, {
    requestId,
    bridge,
    ticker,
    isSyncing,
    dismiss,
    earnMore,
    selectExitAction,
    confirmExit,
    markSigned,
    markBroadcasted,
    markFailed,
    viewDetails,
    close: () => dismissStakePosition(requestId),
    retry,
    abandon: () => abandonStakePosition(requestId),
  });

  const isConfirming = content.view === "transaction" && !content.isOnDevice;
  return {
    surface: {
      isOpen: !isClosed,
      heading:
        content.view === "transaction"
          ? { kind: "confirm", action: content.action }
          : DETAILS_HEADING,
      ticker,
      onBack: isConfirming ? goBack : undefined,
      onDismiss: dismiss,
      isDismissible: phase !== "committed",
      testID: "stake-position-dialog",
    },
    body,
  };
}
