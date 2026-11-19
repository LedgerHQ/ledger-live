import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { findSolanaStakingPosition } from "@ledgerhq/live-common/families/solana/logic";
import type {
  SolanaAccount,
  SolanaStakingPosition,
} from "@ledgerhq/live-common/families/solana/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Operation } from "@ledgerhq/types-live";
import {
  answerStakePositionUnavailable,
  dismissStakePosition,
  getExitAction,
  getExitAmount,
  getStakePositionValidatorName,
  reopenStakePosition,
  toChainExit,
  toStakePositionDetailsProps,
  useStakePositionData,
  useStakePositionSteps,
  useStakePositionTracking,
  type ReadyStakePositionData,
  type StakePositionConfirmProps,
  type StakePositionData,
  type StakePositionDetailsProps,
  type StakePositionExitAction,
  type StakePositionFormatter,
  type StakePositionHeading,
  type StakePositionResultProps,
  type StakePositionSnapshot,
  type StakePositionStep,
  type StakePositionSurfaceProps,
  type StakePositionTrackedButton,
  type StakePositionTrackedStep,
} from "@features/flow-stake-position";
import type { StakePositionSheetProps } from "LLM/features/StakePosition";
import type { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useMaybeAccountName } from "~/reducers/wallet";
import type { ExitTransactionProps, ExitTransactionStage, PreparedExit } from "./ExitTransaction";
import { toStakePositionSnapshot } from "./solanaStakePosition";
import { useStakePositionFormatter } from "./useStakePositionFormatter";

/** The exit as the user confirmed it: the device signs this one whatever the account becomes. */
type ExitToSign = Readonly<{
  transactionKey: string;
  account: SolanaAccount;
  position: SolanaStakingPosition;
  validatorName: string;
}>;

type TransactionStage = Exclude<ExitTransactionStage, "ended">;

type SheetContent =
  | Readonly<{ view: "loading" | "notFound" }>
  | Readonly<{ view: "error"; retry: () => void }>
  | Readonly<{ view: "details"; data: ReadyStakePositionData; snapshot: StakePositionSnapshot }>
  | Readonly<{
      view: "transaction";
      exit: ExitToSign;
      action: StakePositionExitAction;
      stage: TransactionStage;
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
  isAccountRemoved: boolean;
  isSigned: boolean;
  liveTransactionKey: string;
  exitToSign: ExitToSign | null;
}>;

export type SolanaStakePositionSheetBody =
  | Readonly<{ kind: "loading" | "notFound"; onDismiss: () => void }>
  | Readonly<{ kind: "error"; onDismiss: () => void; onRetry: () => void }>
  | Readonly<{ kind: "details"; details: StakePositionDetailsProps; currency: CryptoCurrency }>
  | Readonly<{
      kind: "confirm";
      confirm: Omit<StakePositionConfirmProps, "errorContent">;
      error: Error | undefined;
    }>
  | Readonly<{ kind: "processing" }>
  | Readonly<{
      kind: "success";
      result: Extract<StakePositionResultProps, { outcome: "success" }>;
    }>
  | Readonly<{ kind: "failure"; error: Error; isSigned: boolean; onRetry: () => void }>;

export type SolanaStakePositionSheetViewModel = Readonly<{
  surface: Omit<StakePositionSurfaceProps, "children">;
  body: SolanaStakePositionSheetBody;
  /** The exit transaction and its device step, next to the sheet. */
  exitTransaction: ExitTransactionProps | null;
}>;

type BodyActions = Readonly<{
  ticker: string;
  accountName: string | undefined;
  currency: CryptoCurrency;
  format: StakePositionFormatter;
  isSyncing: boolean;
  prepared: PreparedExit | null;
  dismiss: () => void;
  earnMore: () => void;
  selectExitAction: (action: StakePositionExitAction) => void;
  confirmExit: () => void;
  viewTransaction?: () => void;
  retry: () => void;
  retryLoad: () => void;
}>;

const LOADING: SheetContent = { view: "loading" };
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
function positionContentOf({ data, snapshot, isSyncing }: ContentInputs): SheetContent {
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

function contentOf(step: StakePositionStep, inputs: ContentInputs): SheetContent {
  const {
    account,
    position,
    isClosed,
    isAccountRemoved,
    isSigned,
    liveTransactionKey,
    exitToSign,
  } = inputs;
  // A removed account is only the snapshot the request first saw: nothing in it can be shown.
  if (isAccountRemoved && !isSigned) return { view: "notFound" };
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
      // The sheet stays mounted while it animates out: a signature must not start from there.
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

function trackedStepOf(content: SheetContent): StakePositionTrackedStep | null {
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

function headingOf(content: SheetContent): StakePositionHeading {
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

const isOnDeviceStep = (content: SheetContent) =>
  content.view === "transaction" && content.stage !== "confirm";

function detailsBodyOf(
  { data, snapshot }: Extract<SheetContent, { view: "details" }>,
  actions: BodyActions,
): SolanaStakePositionSheetBody {
  return {
    kind: "details",
    details: {
      ...toStakePositionDetailsProps(
        data,
        toChainExit(snapshot, actions.isSyncing),
        actions.format,
      ),
      ticker: actions.ticker,
      accountName: actions.accountName,
      onEarnMore: actions.earnMore,
      onSelectExitAction: actions.selectExitAction,
      testID: "stake-position-details",
    },
    currency: actions.currency,
  };
}

function confirmBodyOf(
  { exit, action, stage }: Extract<SheetContent, { view: "transaction" }>,
  actions: BodyActions,
): SolanaStakePositionSheetBody {
  if (stage === "broadcasting") return { kind: "processing" };
  const { prepared } = actions;
  const exitAmount = getExitAmount(toStakePositionSnapshot(exit.position), action);
  const preparedExit = prepared?.transactionKey === exit.transactionKey ? prepared : null;
  return {
    kind: "confirm",
    confirm: {
      action,
      ticker: actions.ticker,
      amount: actions.format.amount(exitAmount.toString()).crypto,
      validatorName: exit.validatorName,
      accountName: actions.accountName,
      isPending: !preparedExit || preparedExit.isPending || stage === "signing",
      isConfirmDisabled: !preparedExit?.isReady || preparedExit.error !== undefined,
      onConfirm: actions.confirmExit,
      testID: "stake-position-confirm",
    },
    error: preparedExit?.error,
  };
}

function bodyOf(content: SheetContent, actions: BodyActions): SolanaStakePositionSheetBody {
  switch (content.view) {
    case "loading":
    case "notFound":
      return { kind: content.view, onDismiss: actions.dismiss };
    case "error":
      return { kind: "error", onDismiss: actions.dismiss, onRetry: actions.retryLoad };
    case "details":
      return detailsBodyOf(content, actions);
    case "transaction":
      return confirmBodyOf(content, actions);
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
 * gates and signs the exit, found by the stake account of the request. The device step shows in
 * its own sheet, while this one steps aside, and the result comes back to this one.
 */
export function useSolanaStakePositionSheetViewModel({
  account: requestAccount,
  isAccountRemoved,
  request,
  phase,
  isSyncing,
  onEarnMore,
}: StakePositionSheetProps): SolanaStakePositionSheetViewModel {
  const account = requestAccount as SolanaAccount;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, dispatchStep] = useStakePositionSteps();
  const [exitToSign, setExitToSign] = useState<ExitToSign | null>(null);
  const [prepared, setPrepared] = useState<PreparedExit | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [operation, setOperation] = useState<Operation | null>(null);
  const format = useStakePositionFormatter(account);
  const ticker = account.currency.ticker;
  const accountName = useMaybeAccountName(account);
  const { trackStep, trackButton } = useStakePositionTracking({ origin: request.origin, ticker });
  const requestId = request.id;
  const isClosed = phase === "closed";
  const isSigned = phase === "committed" || phase === "settled";

  const data = useStakePositionData({
    request,
    isOpen: !isClosed,
    network: account.currency.id,
    ownerAddress: account.freshAddress,
  });
  const position = useMemo(
    () => (isAccountRemoved ? undefined : findSolanaStakingPosition(account, request.positionId)),
    [account, isAccountRemoved, request.positionId],
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
    isAccountRemoved,
    isSigned,
    liveTransactionKey: `${attempt}:${revisionOf(account, snapshot)}`,
    exitToSign,
  });
  // The Earn live app shows its own menu for a position the host cannot show, instead of a sheet.
  const isUnavailableToEarn =
    request.origin === "earn" && !isAccountRemoved && shownContent.view === "notFound";
  const content = isUnavailableToEarn ? LOADING : shownContent;
  const trackedStep = isClosed ? null : trackedStepOf(content);
  const isSignedFailure = content.view === "failure" && content.isSigned;

  useEffect(() => {
    if (isUnavailableToEarn) answerStakePositionUnavailable(requestId);
  }, [isUnavailableToEarn, requestId]);

  // A result has no close button of its own: a signed request opens again so the header closes it.
  useEffect(() => {
    if (isSignedFailure) reopenStakePosition(requestId);
  }, [isSignedFailure, requestId]);

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
    if (content.view !== "transaction" || content.stage !== "confirm") return;
    trackPageButton("confirm");
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
  const cancelSignature = useCallback(() => dismissStakePosition(requestId), [requestId]);

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
        navigation.navigate(NavigatorName.Base, {
          screen: ScreenName.OperationDetails,
          params: { accountId: account.id, operation },
        });
      }
    : undefined;

  const body = bodyOf(content, {
    ticker,
    accountName,
    currency: account.currency,
    format,
    isSyncing,
    prepared,
    dismiss,
    earnMore,
    selectExitAction,
    confirmExit,
    viewTransaction,
    retry,
    retryLoad,
  });

  // Mounted from the confirmation to the result, so the device step can animate out.
  const transactionExit =
    content.view === "transaction" && !isClosed
      ? { exit: content.exit, action: content.action, stage: content.stage }
      : null;
  const signedExit =
    exitToSign && step.name !== "details"
      ? { exit: exitToSign, action: step.action, stage: "ended" as const }
      : null;
  const shownExit = transactionExit ?? signedExit;

  return {
    surface: {
      isOpen: !isClosed && !isOnDeviceStep(content),
      heading: headingOf(content),
      ticker,
      currencyName: account.currency.name,
      onDismiss: dismiss,
      isDismissible: phase !== "committed",
      testID: "stake-position-sheet",
    },
    body,
    exitTransaction: shownExit && {
      requestId,
      transactionKey: shownExit.exit.transactionKey,
      account: shownExit.exit.account,
      position: shownExit.exit.position,
      action: shownExit.action,
      stage: shownExit.stage,
      onPreparedChange: setPrepared,
      onCancel: cancelSignature,
      onSigned: markSigned,
      onBroadcasted: markBroadcasted,
      onFailed: markFailed,
    },
  };
}
