import { of, Observable } from "rxjs";
import { scan, catchError, tap } from "rxjs/operators";
import { useCallback, useEffect, useRef, useState } from "react";
import { log } from "@ledgerhq/logs";
import { buildSignCommonEvent, TransactionPathway } from "@ledgerhq/transaction-observability";
import { TransactionRefusedOnDevice } from "../../errors";
import { getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./types";
import type { AppRequest, AppState } from "./app";
import { createAction as createAppAction } from "./app";
import { interruptionErrorOf } from "./interruptionError";
import { useSignAttemptObservability } from "./signAttemptObservability";
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
    // Kept as primitives: a rerender that hands over an equivalent device object must not
    // resubscribe and ask the user to sign again. Mock and Speculos devices carry an empty
    // `deviceId`, so presence is `undefined` vs defined, never truthiness.
    const deviceId = device?.deviceId;
    const deviceModelId = device?.modelId;
    const [state, setState] = useState(initialState);

    const {
      abandonAttempt,
      beginAttempt,
      failInterruptedAttempt,
      isSettled,
      noteSettled,
      notePromptShown,
      resetAttempt,
    } = useSignAttemptObservability(
      useCallback(
        () =>
          buildSignCommonEvent({
            account,
            mainAccount: mainAccountRef.current,
            pathway: manifestId
              ? TransactionPathway.WalletApiSignAndBroadcast
              : TransactionPathway.Send,
            manifestId,
          }),
        [account, manifestId],
      ),
    );
    // A raw sign has no structured transaction to key an attempt on, so the request itself is
    // the identity: the same one resubscribing is the same attempt, a different one is a new.
    const attemptRequestKeyRef = useRef<string | null>(null);

    useEffect(() => {
      if (
        deviceId === undefined ||
        deviceModelId === undefined ||
        !opened ||
        inWrongDeviceForAccount ||
        error
      ) {
        failInterruptedAttempt(interruptionErrorOf(inWrongDeviceForAccount, error));
        setState(initialState);
        resetAttempt();
        attemptRequestKeyRef.current = null;
        return;
      }

      let cancelled = false;
      let sub: { unsubscribe: () => void } | undefined;
      const requestKey = [
        mainAccountId,
        transaction,
        broadcast ? "1" : "0",
        manifestId ?? "",
        deviceId,
        deviceModelId,
      ].join("\0");
      (async () => {
        const signingAccount = mainAccountRef.current;
        const bridge = await getAccountBridge(signingAccount);
        if (cancelled) return;

        const signRawOperation = () => {
          if (cancelled) return undefined;

          if (attemptRequestKeyRef.current === requestKey) {
            if (isSettled()) return undefined;
          } else {
            abandonAttempt();
            attemptRequestKeyRef.current = requestKey;
            beginAttempt();
          }
          return bridge.signRawOperation({
            account: signingAccount,
            transaction,
            deviceId,
            deviceModelId,
            broadcast,
          });
        };

        let signRawOperationObservable: Observable<SignOperationEvent> | undefined;
        try {
          signRawOperationObservable = manifestId
            ? await withLiveAppContext({ id: manifestId }, async () => signRawOperation())
            : signRawOperation();
        } catch (signingError) {
          noteSettled();
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
              if (e.type === "device-signature-requested") notePromptShown();
              if (e.type === "signed" || e.type === "error") noteSettled();
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
      deviceId,
      deviceModelId,
      abandonAttempt,
      failInterruptedAttempt,
      mainAccountId,
      transaction,
      broadcast,
      opened,
      inWrongDeviceForAccount,
      error,
      manifestId,
      beginAttempt,
      isSettled,
      notePromptShown,
      noteSettled,
      resetAttempt,
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
