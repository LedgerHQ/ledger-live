import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import type { SignedOperation } from "@ledgerhq/types-live";
import { getAccountCurrency, getParentAccount } from "@ledgerhq/live-common/account/index";
import { parseCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import type { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { executeSwap } from "@ledgerhq/live-common/wallet-api/Exchange/executeSwap";
import trackingWrapper from "@ledgerhq/live-common/wallet-api/Exchange/tracking";
import { ExchangeType, type SwapUiRequest } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import { PERPS_DEPOSIT_QUOTE_PROVIDER } from "@ledgerhq/live-common/wallet-api/Perps/depositQuote";
import type { PerpsDepositReviewParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { Action } from "@ledgerhq/live-common/hw/actions/types";
import type { Result as StartExchangeResult } from "@ledgerhq/live-common/hw/actions/startExchange";
import type { Result as CompleteExchangeResult } from "@ledgerhq/live-common/hw/actions/completeExchange";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { useFeatureFlags } from "@features/platform-feature-flags";
import type { Feature, FeatureId } from "@shared/feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { shallowAccountsSelector } from "~/reducers/accounts";
import { mevProtectionSelector } from "~/reducers/settings";
import {
  useCompleteExchangeDeviceAction,
  useStartExchangeDeviceAction,
  useTransactionDeviceAction,
} from "~/hooks/deviceActions";
import type { Status } from "~/components/DeviceAction";
import { broadcastLogger } from "~/datadog";
import { track } from "~/analytics";
import { isUserRefusal } from "../utils/isUserRefusal";

type StartResult = StartExchangeResult;
type CompleteResult = CompleteExchangeResult;
type SignResult = { signedOperation: SignedOperation } | { transactionSignError: Error };

export type PerpsDepositDeviceStep =
  | { kind: "processing" }
  | { kind: "error"; error: Error }
  | {
      kind: "device";
      stepId: "start" | "confirm" | "sign";
      withDeviceAction: <T>(
        render: <R, H extends Status, P>(binding: {
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

export type PerpsDepositExecutionCallbacks = Readonly<{
  onDone: () => void;
  onRefused: () => void;
}>;

const EXCHANGE_APP_NAME = "Exchange";
const FEE_STRATEGY = "medium";

/** The swap orchestration's analytics sink, pointed at the perps flow. */
const tracking = trackingWrapper((eventName, properties, mandatory) =>
  track(eventName, { ...properties, flowInitiatedFrom: "Perps" }, mandatory),
);

/**
 * Runs a perps deposit through `executeSwap`, which owns the sequence, and
 * renders its device steps in the perps signing screen rather than the live-app
 * exchange stack.
 */
export function usePerpsDepositExecution(
  params: PerpsDepositReviewParams,
  { onDone, onRefused }: PerpsDepositExecutionCallbacks,
): PerpsDepositExecution {
  const [deviceStep, setDeviceStep] = useState<PerpsDepositDeviceStep>(PROCESSING_STEP);

  const dispatch = useDispatch();
  const accounts = useSelector(shallowAccountsSelector);
  const mevProtected = useSelector(mevProtectionSelector);

  const featureFlagsMap = useFeatureFlags();
  const getFeature = useCallback(
    (id: FeatureId): Feature | null => featureFlagsMap[id] ?? null,
    [featureFlagsMap],
  );

  const startAction = useStartExchangeDeviceAction();
  const signAction = useTransactionDeviceAction();
  const completeAction = useCompleteExchangeDeviceAction();

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
    async (exchangeParams: SwapUiRequest) => {
      const completeResult = await runDeviceStep<CompleteResult>(onResult => ({
        kind: "device",
        stepId: "confirm",
        withDeviceAction: render =>
          render({
            action: completeAction,
            request: {
              provider: exchangeParams.provider ?? PERPS_DEPOSIT_QUOTE_PROVIDER,
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
            action: signAction,
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
          provider: PERPS_DEPOSIT_QUOTE_PROVIDER,
        });
        if (accountId && updater) {
          dispatch(updateAccountWithUpdater({ accountId, updater }));
        }
      }

      return { operation, swapId };
    },
    [
      broadcast,
      completeAction,
      depositAccount,
      dispatch,
      fromParentAccount,
      quotedReceiveAmount,
      runDeviceStep,
      signAction,
    ],
  );

  const executeDeposit = useCallback(async () => {
    try {
      // Reset to the loading state on every run (including retry after an error).
      setDeviceStep(PROCESSING_STEP);

      // `executeSwap` resolves both accounts by their wallet-api id.
      setWalletApiIdForAccountId(depositAccount.id);
      setWalletApiIdForAccountId(receiverAccount.id);

      const depositCurrency = getAccountCurrency(depositAccount);

      let signed: Awaited<ReturnType<typeof confirmSignAndBroadcast>> | undefined;

      await executeSwap(
        {
          accounts,
          tracking,
          getFeature,
          uiHooks: {
            "custom.exchange.start": ({ exchangeParams, onSuccess, onCancel }) => {
              void runDeviceStep<StartResult>(onResult => ({
                kind: "device",
                stepId: "start",
                withDeviceAction: render =>
                  render({
                    action: startAction,
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
              void confirmSignAndBroadcast(exchangeParams).then(result => {
                signed = result;
                onSuccess({ operationHash: result.operation.hash, swapId: result.swapId ?? "" });
              }, onCancel);
            },

            "custom.exchange.error": ({ onCancel }) => onCancel(),
          },
        },
        {
          exchangeType: "SWAP",
          provider: PERPS_DEPOSIT_QUOTE_PROVIDER,
          fromAccountId: getWalletApiIdFromAccountId(depositAccount.id),
          toAccountId: getWalletApiIdFromAccountId(receiverAccount.id),
          fromAmount: amountSent,
          fromAmountAtomic: parseCurrencyUnit(depositCurrency.units[0], amountSent),
          quoteId,
          feeStrategy: FEE_STRATEGY,
        },
      );

      if (!signed) return;

      onDone();
    } catch (e) {
      if (isUserRefusal(e)) {
        onRefused();
        return;
      }
      setDeviceStep({ kind: "error", error: e instanceof Error ? e : new Error(String(e)) });
    }
  }, [
    accounts,
    amountSent,
    confirmSignAndBroadcast,
    depositAccount,
    getFeature,
    onDone,
    onRefused,
    quoteId,
    receiverAccount,
    runDeviceStep,
    startAction,
  ]);

  const retry = useCallback(() => {
    void executeDeposit();
  }, [executeDeposit]);

  return {
    deviceStep,
    executeDeposit,
    retry,
  };
}
