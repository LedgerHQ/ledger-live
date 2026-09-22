import { of, Observable } from "rxjs";
import { scan, catchError, tap } from "rxjs/operators";
import { useCallback, useEffect, useRef, useState } from "react";
import { log } from "@ledgerhq/logs";
import {
  buildSignCommonEvent,
  buildTransactionAbandonedEvent,
  buildTransactionFailureEvent,
  emitTransactionEvent,
  TransactionPathway,
  TransactionStage,
} from "@ledgerhq/transaction-observability";
import { TransactionRefusedOnDevice } from "../../errors";
import { getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./types";
import type { AppRequest, AppState } from "./app";
import { createAction as createAppAction } from "./app";
import { interruptionErrorOf } from "./interruptionError";
import { withLiveAppContext } from "../../wallet-api/blindSigningContext";
import type {
  Account,
  AccountLike,
  SignedOperation,
  SignOperationEvent,
} from "@ledgerhq/types-live";

type State = {
  signedOperation: SignedOperation | null | undefined;
  deviceSignatureRequested: boolean;
  deviceStreamingProgress: number | null | undefined;
  transactionSignError: Error | null | undefined;
  transactionChecksOptInTriggered: boolean;
  transactionChecksOptIn: boolean | null;
  manifestId?: string;
  manifestName?: string;
};
type RawTransactionState = AppState & State;
type RawTransactionRequest = {
  parentAccount: Account | null | undefined;
  account: AccountLike;
  transaction: string;
  broadcast?: boolean;
  appName?: string;
  dependencies?: AppRequest[];
  requireLatestFirmware?: boolean;
  manifestId?: string;
  manifestName?: string;
};
export type RawTransactionResult =
  | {
      signedOperation: SignedOperation;
      device: Device;
      swapId?: string;
    }
  | {
      transactionSignError: Error;
    };
type TransactionAction = Action<RawTransactionRequest, RawTransactionState, RawTransactionResult>;

const mapResult = ({
  device,
  signedOperation,
  transactionSignError,
}: RawTransactionState): RawTransactionResult | null | undefined => {
  if (signedOperation && device) {
    return {
      signedOperation,
      device,
    };
  }

  if (transactionSignError) {
    return {
      transactionSignError,
    };
  }

  return null;
};

type Event =
  | SignOperationEvent
  | {
      type: "error";
      error: Error;
    };
const initialState: State = {
  signedOperation: null,
  deviceSignatureRequested: false,
  deviceStreamingProgress: null,
  transactionSignError: null,
  transactionChecksOptInTriggered: false,
  transactionChecksOptIn: null,
};

const reducer = (state: State, e: Event): State => {
  switch (e.type) {
    case "error": {
      const { error } = e;
      const transactionSignError =
        (error as { name?: string; statusCode?: number }).name === "TransportStatusError" &&
        (error as { statusCode?: number }).statusCode === 0x6985
          ? new TransactionRefusedOnDevice()
          : error;
      return { ...initialState, transactionSignError };
    }

    case "signed":
      return { ...state, signedOperation: e.signedOperation };

    case "device-signature-requested":
      return { ...state, deviceSignatureRequested: true };

    case "device-signature-granted":
      return { ...state, deviceSignatureRequested: false };

    case "device-streaming":
      return { ...state, deviceStreamingProgress: e.progress };

    case "transaction-checks-opt-in-triggered":
      return { ...state, transactionChecksOptInTriggered: true };

    case "transaction-checks-opt-in":
      return { ...state, transactionChecksOptIn: true };

    case "transaction-checks-opt-out":
      return { ...state, transactionChecksOptIn: false };

    default:
      return state;
  }
};

export const createAction = (
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>,
): TransactionAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    {
      account,
      parentAccount,
      transaction,
      broadcast,
      appName,
      dependencies,
      requireLatestFirmware,
      manifestId,
      manifestName,
    }: RawTransactionRequest,
  ): RawTransactionState => {
    const mainAccount = getMainAccount(account, parentAccount);
    const mainAccountRef = useRef(mainAccount);
    useEffect(() => {
      mainAccountRef.current = mainAccount;
    }, [mainAccount]);
    const mainAccountId = mainAccount.id;

    const appState = createAppAction(connectAppExec).useHook(reduxDevice, {
      account: mainAccount,
      appName,
      dependencies,
      requireLatestFirmware,
    });
    const { device, opened, inWrongDeviceForAccount, error } = appState;
    const [state, setState] = useState(initialState);

    const pathway = manifestId
      ? TransactionPathway.WalletApiSignAndBroadcast
      : TransactionPathway.Send;
    const buildCommon = useCallback(
      () =>
        buildSignCommonEvent({
          account,
          mainAccount: mainAccountRef.current,
          pathway,
          manifestId,
        }),
      [account, manifestId, pathway],
    );
    const buildCommonRef = useRef(buildCommon);
    buildCommonRef.current = buildCommon;

    const attemptStartedRef = useRef(false);
    const promptShownRef = useRef(false);
    const settledRef = useRef(false);
    const attemptCommonRef = useRef<ReturnType<typeof buildSignCommonEvent> | null>(null);
    const attemptRequestKeyRef = useRef<string | null>(null);

    const abandonAttempt = useCallback(() => {
      if (!attemptStartedRef.current || settledRef.current) return;

      settledRef.current = true;
      const common = attemptCommonRef.current;
      if (!common) return;
      emitTransactionEvent(
        buildTransactionAbandonedEvent(common, {
          operationalOnly: !promptShownRef.current,
        }),
      );
    }, []);

    const failInterruptedAttempt = useCallback((interruptionError: Error) => {
      if (!attemptStartedRef.current || settledRef.current) return;

      settledRef.current = true;
      const common = attemptCommonRef.current;
      if (!common) return;
      emitTransactionEvent({
        ...buildTransactionFailureEvent(common, {
          stage: TransactionStage.Sign,
          error: interruptionError,
        }),
        operationalOnly: true,
      });
    }, []);

    useEffect(() => () => abandonAttempt(), [abandonAttempt]);

    useEffect(() => {
      if (!device || !opened || inWrongDeviceForAccount || error) {
        failInterruptedAttempt(interruptionErrorOf(inWrongDeviceForAccount, error));
        setState(initialState);
        attemptStartedRef.current = false;
        promptShownRef.current = false;
        settledRef.current = false;
        attemptCommonRef.current = null;
        attemptRequestKeyRef.current = null;
        return;
      }

      let cancelled = false;
      let sub: { unsubscribe: () => void } | undefined;
      const requestKey = [mainAccountId, transaction, broadcast ? "1" : "0", manifestId ?? ""].join(
        "\0",
      );
      (async () => {
        const signingAccount = mainAccountRef.current;
        const bridge = await getAccountBridge(signingAccount);
        if (cancelled) return;

        const signRawOperation = () => {
          if (cancelled) return undefined;

          if (attemptRequestKeyRef.current === requestKey) {
            if (settledRef.current) return undefined;
          } else {
            abandonAttempt();
            attemptRequestKeyRef.current = requestKey;
            attemptStartedRef.current = true;
            promptShownRef.current = false;
            settledRef.current = false;
            try {
              attemptCommonRef.current = buildCommonRef.current();
            } catch {
              try {
                attemptCommonRef.current = buildSignCommonEvent({
                  account: signingAccount,
                  mainAccount: signingAccount,
                  pathway,
                  manifestId,
                });
              } catch {
                attemptCommonRef.current = null;
              }
            }
          }
          return bridge.signRawOperation({
            account: signingAccount,
            transaction,
            deviceId: device.deviceId,
            deviceModelId: device.modelId,
            broadcast,
          });
        };

        let signRawOperationObservable: Observable<SignOperationEvent> | undefined;
        try {
          signRawOperationObservable = manifestId
            ? await withLiveAppContext({ id: manifestId }, async () => signRawOperation())
            : signRawOperation();
        } catch (signingError) {
          settledRef.current = true;
          if (!cancelled) {
            setState(
              reducer(initialState, {
                type: "error",
                error:
                  signingError instanceof Error ? signingError : new Error(String(signingError)),
              }),
            );
          }
          return;
        }

        if (cancelled) return;
        if (!signRawOperationObservable) return;
        sub = signRawOperationObservable
          .pipe(
            catchError(signingError =>
              of<{ type: "error"; error: Error }>({
                type: "error",
                error: signingError,
              }),
            ),
            tap((e: Event) => {
              if (e.type === "device-signature-requested") promptShownRef.current = true;
              if (e.type === "signed" || e.type === "error") settledRef.current = true;
              log("actions-transaction-event", e.type, e);
            }),
            scan(reducer, initialState),
          )
          .subscribe((x: any) => setState(x));
      })();
      return () => {
        cancelled = true;
        sub?.unsubscribe();
      };
    }, [
      device,
      abandonAttempt,
      failInterruptedAttempt,
      mainAccountId,
      transaction,
      broadcast,
      opened,
      inWrongDeviceForAccount,
      error,
      manifestId,
      pathway,
    ]);
    return {
      ...appState,
      ...state,
      manifestId,
      manifestName,
      deviceStreamingProgress:
        state.signedOperation || state.transactionSignError
          ? null // when good app is opened, we start the progress so it doesn't "blink"
          : state.deviceStreamingProgress || (appState.opened ? 0 : null),
    };
  };

  return {
    useHook,
    mapResult,
  };
};
