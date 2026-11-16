import { useCallback, useEffect, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useNavigation } from "@react-navigation/native";
import {
  findSolanaStakingPosition,
  solanaActivationState,
} from "@ledgerhq/live-common/families/solana/logic";
import { useSolanaValidators } from "@ledgerhq/live-common/families/solana/react";
import type {
  SolanaAccount,
  SolanaStakingPosition,
  Transaction as SolanaTransaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/solana/types";
import {
  commitStakePosition,
  dismissStakePosition,
  getDisplayedAmount,
  getExitAction,
  getExitAmount,
  getPositionNotice,
  resolvePositionMatch,
  settleStakePositionUnavailable,
  useStakePositionSteps,
  useStakePositionTracking,
  type ShownStakePositionRequest,
  type StakePositionConfirmProps,
  type StakePositionDetailsProps,
  type StakePositionExitAction,
  type StakePositionHeading,
  type StakePositionStep,
  type StakePositionTrackedButton,
  type StakePositionTrackedPage,
  type StakePositionTrackedStep,
} from "@features/flow-stake-position";
import type { StakePositionSheetProps } from "LLM/features/StakePosition";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";
import { useLocale, useTranslation } from "~/context/Locale";
import type { ExitTransactionConfirmProps } from "./ExitTransactionConfirm/useExitTransactionConfirmViewModel";
import { formatApy, shortAddress } from "./formatStakePosition";
import {
  toBigNumber,
  toStakePositionCandidates,
  toStakePositionSnapshot,
} from "./solanaStakePosition";
import { useStakePositionAmountFormatter } from "./useStakePositionAmountFormatter";

type SheetContent =
  | Readonly<{ kind: "loading" | "notFound" | "ambiguous" }>
  | Readonly<{ kind: "position"; position: SolanaStakingPosition }>;

export type SolanaStakePositionSheetBody =
  | Readonly<{ kind: "unavailable"; reason: "loading" | "notFound" }>
  | Readonly<{ kind: "details"; details: StakePositionDetailsProps }>
  | Readonly<{
      kind: "confirm";
      confirm: ExitTransactionConfirmProps;
      /** Shown while the account bridge loads. */
      preparing: StakePositionConfirmProps;
    }>;

export type SolanaStakePositionSheetViewModel = Readonly<{
  isOpen: boolean;
  heading: StakePositionHeading;
  ticker: string;
  onBack?: () => void;
  onDismiss: () => void;
  body: SolanaStakePositionSheetBody;
}>;

const DETAILS_HEADING: StakePositionHeading = { kind: "details" };

const EXIT_BUTTONS = {
  deactivate: "deactivate",
  withdraw: "withdraw_all",
} as const satisfies Record<StakePositionExitAction, StakePositionTrackedButton>;

const waitForPreparation = () => undefined;

function contentOf(
  account: SolanaAccount,
  request: ShownStakePositionRequest,
  { isAccountRemoved, isSyncing }: Pick<StakePositionSheetProps, "isAccountRemoved" | "isSyncing">,
): SheetContent {
  const position = isAccountRemoved
    ? undefined
    : findSolanaStakingPosition(account, request.positionId);
  if (!position) return { kind: isSyncing ? "loading" : "notFound" };
  // The match waits for the sync: another position of the validator may appear or go away.
  if (isSyncing) return { kind: "position", position };
  const match = resolvePositionMatch(toStakePositionCandidates(account), request);
  return match.kind === "match" ? { kind: "position", position } : match;
}

/** The exit being confirmed, as long as the position still offers it. */
function confirmedActionOf(
  content: SheetContent,
  step: StakePositionStep,
): StakePositionExitAction | null {
  if (content.kind !== "position" || step.name !== "confirm") return null;
  const exitAction = getExitAction(toStakePositionSnapshot(content.position));
  return exitAction === step.action ? exitAction : null;
}

function pageOf(
  content: SheetContent,
  confirmedAction: StakePositionExitAction | null,
): StakePositionTrackedPage | null {
  if (content.kind === "notFound") return "notFound";
  if (content.kind !== "position") return null;
  return confirmedAction ? "confirm" : "details";
}

function trackedStepOf(
  page: StakePositionTrackedPage | null,
  positionStatus: ReturnType<typeof solanaActivationState> | undefined,
  action: StakePositionExitAction | undefined,
): StakePositionTrackedStep | null {
  if (page === "notFound") return { page };
  if (page === "details" && positionStatus) return { page, positionStatus };
  if (page === "confirm" && action) return { page, action };
  return null;
}

/** The step to track, rebuilt only when what it reports changes. */
function useTrackedStep(content: SheetContent, confirmedAction: StakePositionExitAction | null) {
  const page = pageOf(content, confirmedAction);
  const positionStatus =
    page === "details" && content.kind === "position"
      ? solanaActivationState(content.position)
      : undefined;
  const action = confirmedAction ?? undefined;

  return useMemo(() => trackedStepOf(page, positionStatus, action), [page, positionStatus, action]);
}

export function useSolanaStakePositionSheetViewModel({
  account,
  isAccountRemoved,
  request,
  isOpen,
  isSyncing,
  onEarnMore,
}: StakePositionSheetProps): SolanaStakePositionSheetViewModel {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { ticker } = account.currency;
  const solanaAccount = account as SolanaAccount;
  const navigation = useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const [step, dispatchStep] = useStakePositionSteps();
  const { trackStep, trackButton } = useStakePositionTracking({ origin: request.origin, ticker });
  const formatAmount = useStakePositionAmountFormatter(account);
  const validators = useSolanaValidators(account.currency);

  const content = contentOf(solanaAccount, request, { isAccountRemoved, isSyncing });
  const confirmedAction = confirmedActionOf(content, step);
  const trackedStep = useTrackedStep(content, confirmedAction);
  const isSheetOpen = isOpen && content.kind !== "ambiguous";

  useEffect(() => {
    if (isOpen && content.kind === "ambiguous") {
      settleStakePositionUnavailable(request.id, "ambiguous");
    }
  }, [isOpen, content.kind, request.id]);

  useEffect(() => {
    if (isSheetOpen && trackedStep) trackStep(trackedStep);
  }, [isSheetOpen, trackedStep, trackStep]);

  const onDismiss = useCallback(() => {
    trackButton("close", trackedStep?.page ?? "details");
    dismissStakePosition(request.id);
  }, [trackButton, trackedStep, request.id]);

  const onBack = useCallback(() => {
    if (!confirmedAction) return;
    trackButton("back", "confirm", confirmedAction);
    dispatchStep({ type: "back" });
  }, [confirmedAction, trackButton, dispatchStep]);

  const isConfirmStep = step.name === "confirm";
  const onSelectExitAction = useCallback(
    (action: StakePositionExitAction) => {
      trackButton(EXIT_BUTTONS[action], "details", action);
      // A confirmation the position stopped offering shows the details: its step is left first.
      if (isConfirmStep) dispatchStep({ type: "back" });
      dispatchStep({ type: "selectExit", action });
    },
    [isConfirmStep, trackButton, dispatchStep],
  );

  const onEarnMoreClick = useCallback(() => {
    trackButton("earn_more", "details");
    onEarnMore();
  }, [trackButton, onEarnMore]);

  const onHandOff = useCallback(
    (transaction: SolanaTransaction, status: TransactionStatus) => {
      if (!confirmedAction) return;
      trackButton("confirm", "confirm", confirmedAction);
      // Committed, the request leaves the open phase: the sheet closes without answering.
      commitStakePosition(request.id);
      navigation.navigate(NavigatorName.SolanaStakePositionFlow, {
        screen: ScreenName.SolanaStakePositionSelectDevice,
        params: {
          accountId: account.id,
          transaction,
          status,
          requestId: request.id,
          action: confirmedAction,
          analyticsPropertyFlow: "stake",
        },
      });
    },
    [confirmedAction, trackButton, request.id, navigation, account.id],
  );

  const sheet = { isOpen: isSheetOpen, ticker, onDismiss };

  if (content.kind !== "position") {
    const reason = content.kind === "notFound" ? "notFound" : "loading";
    return { ...sheet, heading: DETAILS_HEADING, body: { kind: "unavailable", reason } };
  }

  const { position } = content;
  const snapshot = toStakePositionSnapshot(position);
  const validator = validators.find(({ voteAccount }) => voteAccount === position.validatorAddress);
  const validatorName =
    validator?.name ||
    shortAddress(position.validatorAddress) ||
    t("stakePosition.details.unavailableValue");

  if (confirmedAction) {
    const action = confirmedAction;
    const shown = {
      ticker,
      action,
      amount: formatAmount(toBigNumber(getExitAmount(snapshot, action))),
      validatorName,
    };
    return {
      ...sheet,
      heading: { kind: "confirm", action },
      onBack,
      body: {
        kind: "confirm",
        confirm: { ...shown, account, position, formatAmount, isFrozen: !isOpen, onHandOff },
        preparing: {
          ...shown,
          isPending: true,
          isConfirmDisabled: true,
          onConfirm: waitForPreparation,
        },
      },
    };
  }

  return {
    ...sheet,
    heading: DETAILS_HEADING,
    body: {
      kind: "details",
      details: {
        ticker,
        state: snapshot.state,
        balance: formatAmount(toBigNumber(getDisplayedAmount(snapshot))),
        rewards:
          request.rewards === undefined ? undefined : formatAmount(new BigNumber(request.rewards)),
        apy: validator?.apy === undefined ? undefined : formatApy(validator.apy, locale),
        validator: { name: validatorName, imageUrl: validator?.avatarUrl },
        address: request.positionId,
        exitAction: getExitAction(snapshot),
        notice: getPositionNotice(snapshot),
        isExitActionPending: isSyncing,
        onEarnMore: onEarnMoreClick,
        onSelectExitAction,
        testID: "solana-stake-position-details",
      },
    },
  };
}
