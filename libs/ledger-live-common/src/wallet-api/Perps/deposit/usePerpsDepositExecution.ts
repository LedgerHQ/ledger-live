import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BigNumber from "bignumber.js";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { useFeatureFlags } from "@features/platform-feature-flags";
import type { Feature, FeatureId } from "@shared/feature-flags";
import { getAccountCurrency, getParentAccount } from "../../../account/index";
import { parseCurrencyUnit } from "../../../currencies/index";
import { getUpdateAccountWithUpdaterParams } from "../../../exchange/swap/getUpdateAccountWithUpdaterParams";
import type { ExchangeSwap } from "../../../exchange/swap/types";
import type { Action } from "../../../hw/actions/types";
import type {
  createAction as createStartExchangeAction,
  Result as StartExchangeResult,
} from "../../../hw/actions/startExchange";
import type {
  createAction as createCompleteExchangeAction,
  Result as CompleteExchangeResult,
} from "../../../hw/actions/completeExchange";
import type { createAction as createTransactionAction } from "../../../hw/actions/transaction";
import { useBroadcast, type LogEvent } from "../../../hooks/useBroadcast";
import { executeSwap } from "../../Exchange/executeSwap";
import { ExchangeType, type SwapUiRequest } from "../../Exchange/server";
import trackingWrapper from "../../Exchange/tracking";
import { getWalletApiIdFromAccountId } from "../../converters";
import { PERPS_SWAPKIT_PROVIDER } from "../constants";
import type { PerpsDepositReviewParams } from "../server";
import { isUserRefusal } from "../isUserRefusal";
import { getDepositRequestId, settleDepositRequest } from "./request";
import {
  getDepositSignFailedEvent,
  toDepositSignErrorStep,
  type DepositSignErrorStep,
} from "./signError";

type StartExchangeAction = ReturnType<typeof createStartExchangeAction>;
type CompleteExchangeAction = ReturnType<typeof createCompleteExchangeAction>;
type TransactionAction = ReturnType<typeof createTransactionAction>;

export type PerpsDepositHookState =
  | ReturnType<StartExchangeAction["useHook"]>
  | ReturnType<CompleteExchangeAction["useHook"]>
  | ReturnType<TransactionAction["useHook"]>;

type SignResult = { signedOperation: SignedOperation } | { transactionSignError: Error };

export type PerpsDepositDeviceStep =
  | { kind: "processing" }
  | DepositSignErrorStep
  | {
      kind: "device";
      stepId: "start" | "confirm" | "sign";
      withDeviceAction: <T>(
        render: <R, H extends PerpsDepositHookState, P>(binding: {
          action: Action<R, H, P>;
          request: R;
          onResult: (result: P) => void;
        }) => T,
      ) => T;
    };

type PerpsDepositDevicePhase = Extract<PerpsDepositDeviceStep, { kind: "device" }>;

const PROCESSING_STEP: PerpsDepositDeviceStep = { kind: "processing" };

export type PerpsDepositExecution = Readonly<{
  deviceStep: PerpsDepositDeviceStep;
  executeDeposit: () => Promise<void>;
  retry: () => void;
}>;

export type PerpsDepositOutcome = Readonly<{
  swapId?: string;
}>;

export type PerpsDepositExecutionCallbacks = Readonly<{
  onDone: (outcome: PerpsDepositOutcome) => void;
  onRefused: () => void;
  onReturnToForm: () => void;
}>;

export type PerpsDepositTrack = (
  event: string,
  properties: Record<string, unknown> | null,
  options?: { mandatory?: boolean },
) => unknown;

export type PerpsDepositExecutionDeps = Readonly<{
  accounts: AccountLike[];
  mevProtected: boolean;
  deviceActions: Readonly<{
    start: StartExchangeAction;
    confirm: CompleteExchangeAction;
    sign: TransactionAction;
  }>;
  updateAccount: (accountId: string, updater: (account: Account) => Account) => void;
  broadcastLogger?: (event: LogEvent) => void;
  track: PerpsDepositTrack;
}>;

const EXCHANGE_APP_NAME = "Exchange";
const FEE_STRATEGY = "medium";

// Named like the swap drawer's, so /swap/cancelled reports a closed deposit the same way.
class DrawerClosedError extends Error {
  override name = "DrawerClosedError";
}

/**
 * Runs a perps deposit through `executeSwap`, which owns the sequence, and hands its device steps
 * to the app to render.
 */
export function usePerpsDepositExecution(
  params: PerpsDepositReviewParams,
  { onDone, onRefused, onReturnToForm }: PerpsDepositExecutionCallbacks,
  {
    accounts,
    mevProtected,
    deviceActions,
    updateAccount,
    broadcastLogger,
    track,
  }: PerpsDepositExecutionDeps,
): PerpsDepositExecution {
  const [deviceStep, setDeviceStep] = useState<PerpsDepositDeviceStep>(PROCESSING_STEP);

  const cancelSwapRef = useRef<((error: Error) => void) | null>(null);
  const closedRef = useRef(false);

  useEffect(
    () => () => {
      closedRef.current = true;
      cancelSwapRef.current?.(new DrawerClosedError("User closed the deposit"));
    },
    [],
  );

  const tracking = useMemo(
    () =>
      trackingWrapper((eventName, properties, mandatory) =>
        track(eventName, { ...properties, flowInitiatedFrom: "Perps" }, { mandatory: !!mandatory }),
      ),
    [track],
  );

  const featureFlagsMap = useFeatureFlags();
  const getFeature = useCallback(
    (id: FeatureId): Feature | null => featureFlagsMap[id] ?? null,
    [featureFlagsMap],
  );

  const { depositAccount, receiverAccount, amountSent, amountTo, quoteId } = params;
  const fromParentAccount = useMemo(
    () => getParentAccount(depositAccount, accounts),
    [depositAccount, accounts],
  );

  const quotedReceiveAmount = useMemo(
    () => parseCurrencyUnit(getAccountCurrency(receiverAccount).units[0], amountTo),
    [amountTo, receiverAccount],
  );

  const broadcastConfig = useMemo(
    () => ({ mevProtected, source: { type: "swap" as const, name: "perps-deposit" } }),
    [mevProtected],
  );
  const broadcast = useBroadcast({
    account: depositAccount,
    parentAccount: fromParentAccount,
    broadcastConfig,
    logger: broadcastLogger,
  });

  const runDeviceStep = useCallback(
    <R>(build: (onResult: (result: R) => void) => PerpsDepositDevicePhase): Promise<R> =>
      new Promise<R>(resolve => setDeviceStep(build(resolve))).finally(() =>
        setDeviceStep(PROCESSING_STEP),
      ),
    [],
  );

  /**
   * Confirms the provider payload on the Exchange app, signs the funding
   * transaction with the coin app, then broadcasts it.
   */
  const confirmSignAndBroadcast = useCallback(
    async (exchangeParams: SwapUiRequest, onBroadcast: () => void) => {
      const completeResult = await runDeviceStep<CompleteExchangeResult>(onResult => ({
        kind: "device",
        stepId: "confirm",
        withDeviceAction: render =>
          render({
            action: deviceActions.confirm,
            request: {
              provider: exchangeParams.provider ?? PERPS_SWAPKIT_PROVIDER,
              transaction: exchangeParams.transaction,
              binaryPayload: exchangeParams.binaryPayload,
              signature: exchangeParams.signature,
              exchange: exchangeParams.exchange,
              exchangeType: ExchangeType.SWAP,
            },
            onResult,
          }),
      }));
      if ("completeExchangeError" in completeResult) {
        throw completeResult.completeExchangeError;
      }
      const finalTransaction = completeResult.completeExchangeResult;

      const tokenCurrency =
        depositAccount.type === "TokenAccount" ? depositAccount.token : undefined;
      const signResult = await runDeviceStep<SignResult>(onResult => ({
        kind: "device",
        stepId: "sign",
        withDeviceAction: render =>
          render({
            action: deviceActions.sign,
            request: {
              tokenCurrency,
              parentAccount: fromParentAccount,
              account: depositAccount,
              transaction: finalTransaction,
              appName: EXCHANGE_APP_NAME,
            },
            onResult,
          }),
      }));
      if ("transactionSignError" in signResult) {
        throw signResult.transactionSignError;
      }

      onBroadcast();
      const operation = await broadcast(signResult.signedOperation);

      const swapId = exchangeParams.swapId;
      if (swapId) {
        const [accountId, updater] = getUpdateAccountWithUpdaterParams({
          result: { operation, swapId },
          exchange: exchangeParams.exchange as ExchangeSwap,
          transaction: finalTransaction,
          magnitudeAwareRate: finalTransaction.amount.isZero()
            ? new BigNumber(0)
            : quotedReceiveAmount.div(finalTransaction.amount),
          provider: PERPS_SWAPKIT_PROVIDER,
        });
        if (accountId && updater) updateAccount(accountId, updater);
      }

      return { operation, swapId };
    },
    [
      broadcast,
      depositAccount,
      deviceActions.confirm,
      deviceActions.sign,
      fromParentAccount,
      quotedReceiveAmount,
      runDeviceStep,
      updateAccount,
    ],
  );

  const executeDeposit = useCallback(async () => {
    const requestId = getDepositRequestId();
    try {
      setDeviceStep(PROCESSING_STEP);

      const depositCurrency = getAccountCurrency(depositAccount);

      let signed: Awaited<ReturnType<typeof confirmSignAndBroadcast>> | undefined;

      await executeSwap(
        {
          accounts,
          tracking,
          getFeature,
          uiHooks: {
            "custom.exchange.start": ({ exchangeParams, onSuccess, onCancel }) => {
              if (closedRef.current) {
                onCancel(new DrawerClosedError("User closed the deposit"));
                return;
              }
              void runDeviceStep<StartExchangeResult>(onResult => ({
                kind: "device",
                stepId: "start",
                withDeviceAction: render =>
                  render({
                    action: deviceActions.start,
                    request: {
                      ...exchangeParams,
                      exchangeType: ExchangeType[exchangeParams.exchangeType],
                    },
                    onResult,
                  }),
              })).then(result =>
                "startExchangeError" in result
                  ? onCancel(result.startExchangeError.error)
                  : onSuccess(result.startExchangeResult.nonce, result.startExchangeResult.device),
              );
            },
            "custom.exchange.swap": ({ exchangeParams, onSuccess, onCancel }) => {
              if (closedRef.current) {
                onCancel(new DrawerClosedError("User closed the deposit"));
                return;
              }
              let settled = false;
              const cancel = (error: Error) => {
                if (settled) return;
                settled = true;
                cancelSwapRef.current = null;
                onCancel(error);
              };
              cancelSwapRef.current = cancel;
              const beginBroadcast = () => {
                if (settled) throw new DrawerClosedError("User closed the deposit");
                if (cancelSwapRef.current === cancel) cancelSwapRef.current = null;
              };
              void confirmSignAndBroadcast(exchangeParams, beginBroadcast).then(result => {
                if (settled) return;
                settled = true;
                signed = result;
                onSuccess({ operationHash: result.operation.hash, swapId: result.swapId ?? "" });
              }, cancel);
            },
            "custom.exchange.error": () => undefined,
          },
        },
        {
          exchangeType: "SWAP",
          provider: PERPS_SWAPKIT_PROVIDER,
          fromAccountId: getWalletApiIdFromAccountId(depositAccount.id),
          toAccountId: getWalletApiIdFromAccountId(receiverAccount.id),
          fromAmount: amountSent,
          fromAmountAtomic: parseCurrencyUnit(depositCurrency.units[0], amountSent),
          quoteId,
          feeStrategy: FEE_STRATEGY,
        },
      );

      if (!signed) return;

      settleDepositRequest(requestId, { swapId: signed.swapId, amountTo });
      if (closedRef.current) return;
      onDone({ swapId: signed.swapId });
    } catch (e) {
      if (closedRef.current) return;
      if (isUserRefusal(e)) {
        onRefused();
        return;
      }
      const errorStep = toDepositSignErrorStep(e);
      if (errorStep.isGeneric) {
        track("swap error message", getDepositSignFailedEvent(depositAccount, receiverAccount));
      }
      setDeviceStep(errorStep);
    }
  }, [
    accounts,
    amountSent,
    amountTo,
    confirmSignAndBroadcast,
    depositAccount,
    deviceActions.start,
    getFeature,
    onDone,
    onRefused,
    quoteId,
    receiverAccount,
    runDeviceStep,
    track,
    tracking,
  ]);

  const retry = useCallback(() => {
    if (deviceStep.kind === "error" && deviceStep.returnsToForm) {
      onReturnToForm();
      return;
    }
    void executeDeposit();
  }, [deviceStep, executeDeposit, onReturnToForm]);

  return {
    deviceStep,
    executeDeposit,
    retry,
  };
}
