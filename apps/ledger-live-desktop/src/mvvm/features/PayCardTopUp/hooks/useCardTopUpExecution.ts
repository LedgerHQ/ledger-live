import { useCallback, useMemo, useRef, useState } from "react";
import type { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type BigNumber from "bignumber.js";
import { decodeFundPayload } from "@ledgerhq/hw-app-exchange";
import type { Action } from "@ledgerhq/live-common/hw/actions/types";
import type { States } from "~/renderer/components/DeviceAction";
import { createAction as createCompleteExchangeAction } from "@ledgerhq/live-common/hw/actions/completeExchange";
import type { Result as CompleteExchangeResult } from "@ledgerhq/live-common/hw/actions/completeExchange";
import type { Result as StartExchangeResult } from "@ledgerhq/live-common/hw/actions/startExchange";
import completeExchange from "@ledgerhq/live-common/exchange/platform/completeExchange";
import { useBroadcast } from "@ledgerhq/live-common/hooks/useBroadcast";
import { useRequestCardTopUpPayloadMutation } from "@domain/api-card-top-up";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { useTransactionAction, useStartExchangeAction } from "~/renderer/hooks/useConnectAppAction";
import { broadcastLogger } from "~/datadog/logs";
import { useSelector } from "LLD/hooks/redux";
import { mevProtectionSelector } from "~/renderer/reducers/settings";
import { BAANX_FUND_PROVIDER } from "../constants";
import { assertCardTopUpDestination } from "../utils/assertCardTopUpDestination";
import { buildCardTopUpTransaction } from "../utils/buildCardTopUpTransaction";

type SignResult = { signedOperation: SignedOperation } | { transactionSignError: Error };

const FUND_EXCHANGE_TYPE = 0x02;

export type CardTopUpDeviceStep =
  | { kind: "idle" | "processing" }
  | { kind: "success"; operationHash: string }
  | { kind: "error"; error: Error }
  | {
      kind: "device";
      stepId: "start" | "confirm" | "sign";
      withDeviceAction: <T>(
        render: <R, H extends States, P>(binding: {
          action: Action<R, H, P>;
          request: R;
          onResult: (result: P) => void;
        }) => T,
      ) => T;
    };

type DevicePhase = Extract<CardTopUpDeviceStep, { kind: "device" }>;

type UseCardTopUpExecutionParams = Readonly<{
  account: AccountLike;
  parentAccount?: Account;
  asset: CardAssetRow;
}>;

function asError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  if (!error || typeof error !== "object") return new Error(String(error));

  const record = error as Record<string, unknown>;
  const nested = record.error ?? record.cause;
  const nestedError = nested && nested !== error ? asError(nested) : undefined;
  const status = record.statusCode ?? record.status;
  const message =
    (typeof record.message === "string" && record.message) ||
    (typeof record.statusText === "string" && record.statusText) ||
    nestedError?.message ||
    (status === undefined ? "Unknown Card top-up error" : `Card top-up failed (${String(status)})`);
  const normalized = new Error(message);

  if (typeof record.name === "string") normalized.name = record.name;
  return normalized;
}

export function useCardTopUpExecution({
  account,
  parentAccount,
  asset,
}: UseCardTopUpExecutionParams) {
  const [deviceStep, setDeviceStep] = useState<CardTopUpDeviceStep>({ kind: "idle" });
  const failActiveStep = useRef<((error: Error) => void) | null>(null);
  const currentRun = useRef(0);

  const [requestCardTopUpPayload, { reset: forgetCardTopUpPayload }] =
    useRequestCardTopUpPayloadMutation();

  const startAction = useStartExchangeAction();
  const signAction = useTransactionAction();
  const completeAction = useMemo(() => createCompleteExchangeAction(completeExchange), []);
  const mevProtected = useSelector(mevProtectionSelector);

  const fromCurrency = useMemo(() => getAccountCurrency(account), [account]);
  const exchange = useMemo(
    () => ({ fromAccount: account, fromParentAccount: parentAccount, fromCurrency }),
    [account, fromCurrency, parentAccount],
  );
  const broadcastConfig = useMemo(
    () => ({ mevProtected, source: { type: "swap" as const, name: "pay-card-top-up" } }),
    [mevProtected],
  );
  const broadcast = useBroadcast({
    account,
    parentAccount,
    broadcastConfig,
    logger: broadcastLogger,
  });

  const onDeviceError = useCallback((error: Error) => {
    const failure = asError(error);
    if (failActiveStep.current) {
      failActiveStep.current(failure);
      return;
    }
    setDeviceStep({ kind: "error", error: failure });
  }, []);

  const execute = useCallback(
    async (amount: BigNumber) => {
      const run = ++currentRun.current;
      const settle = (step: CardTopUpDeviceStep) => {
        if (run === currentRun.current) setDeviceStep(step);
      };
      const runDeviceStep = <R>(build: (onResult: (result: R) => void) => DevicePhase) => {
        let fail: ((error: Error) => void) | undefined;
        return new Promise<R>((resolve, reject) => {
          fail = reject;
          failActiveStep.current = reject;
          settle(build(resolve));
        }).finally(() => {
          if (failActiveStep.current === fail) failActiveStep.current = null;
          settle({ kind: "processing" });
        });
      };
      setDeviceStep({ kind: "processing" });

      try {
        if (!asset.address.trim()) {
          throw new Error("The selected card wallet has no destination address");
        }
        if (fromCurrency.id !== asset.ledgerId) {
          throw new Error("The selected account does not match the card wallet asset");
        }

        if (
          !amount.isInteger() ||
          !amount.isGreaterThan(0) ||
          amount.isGreaterThan(account.spendableBalance)
        ) {
          throw new Error("Invalid Card top-up amount");
        }
        const inAmount = amount.toNumber();
        if (!Number.isSafeInteger(inAmount)) {
          throw new Error("This amount cannot be sent to the provider exactly");
        }

        const startResult = await runDeviceStep<StartExchangeResult>(onResult => ({
          kind: "device",
          stepId: "start",
          withDeviceAction: render =>
            render({
              action: startAction,
              request: {
                exchangeType: FUND_EXCHANGE_TYPE,
                provider: BAANX_FUND_PROVIDER,
                exchange,
              },
              onResult,
            }),
        }));
        if ("startExchangeError" in startResult) throw startResult.startExchangeError.error;

        const signed = await requestCardTopUpPayload({
          transactionId: startResult.startExchangeResult.nonce,
          inAmount,
          currency: asset.currency,
          inAddress: asset.address,
        })
          .unwrap()
          .finally(forgetCardTopUpPayload);

        const fundPayload = await decodeFundPayload(signed.payload);
        assertCardTopUpDestination(asset.address, fundPayload.inAddress);

        const transaction = await buildCardTopUpTransaction({
          account,
          parentAccount,
          amount,
          payinAddress: asset.address,
          binaryPayload: signed.payload,
        });
        const binaryPayload = Buffer.from(signed.payload, "utf8").toString("hex");

        const completeResult = await runDeviceStep<CompleteExchangeResult>(onResult => ({
          kind: "device",
          stepId: "confirm",
          withDeviceAction: render =>
            render({
              action: completeAction,
              request: {
                provider: BAANX_FUND_PROVIDER,
                transaction,
                binaryPayload,
                signature: signed.signature,
                exchange,
                exchangeType: FUND_EXCHANGE_TYPE,
              },
              onResult,
            }),
        }));
        if ("completeExchangeError" in completeResult) throw completeResult.completeExchangeError;

        const signResult = await runDeviceStep<SignResult>(onResult => ({
          kind: "device",
          stepId: "sign",
          withDeviceAction: render =>
            render({
              action: signAction,
              request: {
                tokenCurrency: account.type === "TokenAccount" ? account.token : undefined,
                parentAccount,
                account,
                transaction: completeResult.completeExchangeResult,
                appName: "Exchange",
              },
              onResult,
            }),
        }));
        if ("transactionSignError" in signResult) throw signResult.transactionSignError;

        const operation = await broadcast(signResult.signedOperation);

        settle({ kind: "success", operationHash: operation.hash });
      } catch (error) {
        settle({ kind: "error", error: asError(error) });
      }
    },
    [
      account,
      asset.address,
      asset.currency,
      asset.ledgerId,
      broadcast,
      completeAction,
      exchange,
      forgetCardTopUpPayload,
      fromCurrency,
      parentAccount,
      requestCardTopUpPayload,
      signAction,
      startAction,
    ],
  );

  const reset = useCallback(() => {
    currentRun.current += 1;
    failActiveStep.current?.(new Error("Card top-up was reset"));
    setDeviceStep({ kind: "idle" });
  }, []);

  return { deviceStep, execute, reset, onDeviceError };
}
