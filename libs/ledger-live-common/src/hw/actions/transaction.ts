import { of, Observable } from "rxjs";
import { scan, catchError, tap } from "rxjs/operators";
import { useCallback, useEffect, useRef, useState } from "react";
import { log } from "@ledgerhq/logs";
import {
  buildSignCommonEvent,
  buildTransactionAbandonedEvent,
  emitTransactionEvent,
  TransactionPathway,
} from "@ledgerhq/transaction-observability";
import type { Transaction, TransactionStatus } from "../../coin-modules/transaction-types";
import { TransactionRefusedOnDevice } from "../../errors";
import { getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./types";
import type { AppRequest, AppState } from "./app";
import { createAction as createAppAction } from "./app";
import type {
  Account,
  AccountBridge,
  AccountLike,
  SignedOperation,
  SignOperationEvent,
} from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { bridge as ACREBridge } from "../../families/bitcoin/ACRESetup";

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
type TransactionState = AppState & State;
type TransactionRequest = {
  tokenCurrency?: TokenCurrency | null | undefined;
  parentAccount: Account | null | undefined;
  account: AccountLike;
  transaction: Transaction;
  status?: TransactionStatus;
  appName?: string;
  dependencies?: AppRequest[];
  requireLatestFirmware?: boolean;
  manifestId?: string;
  manifestName?: string;
  isACRE?: boolean;
};
export type TransactionResult =
  | {
      signedOperation: SignedOperation;
      device: Device;
      swapId?: string;
    }
  | {
      transactionSignError: Error;
    };
type TransactionAction = Action<TransactionRequest, TransactionState, TransactionResult>;

const mapResult = ({
  device,
  signedOperation,
  transactionSignError,
}: TransactionState): TransactionResult | null | undefined =>
  signedOperation && device
    ? {
        signedOperation,
        device,
      }
    : transactionSignError
      ? {
          transactionSignError,
        }
      : null;

type Event =
  | SignOperationEvent
  | {
      type: "error";
      error: Error;
    };
const initialState = {
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
    txRequest: TransactionRequest,
  ): TransactionState => {
    const {
      transaction,
      appName,
      dependencies,
      requireLatestFirmware,
      manifestId,
      manifestName,
      isACRE,
    } = txRequest;
    const mainAccount = getMainAccount(txRequest.account, txRequest.parentAccount);
    // A background account sync hands down a new account object with the same id. Tearing down an
    // in-flight device signature request over that identity change abandons a prompt the device is
    // still showing: the approval the user then gives lands on a closed subscriber, and the fresh
    // request asks them to sign all over again. Keyed on the id, with the live object read via ref.
    const mainAccountRef = useRef(mainAccount);
    useEffect(() => {
      mainAccountRef.current = mainAccount;
    }, [mainAccount]);
    const mainAccountId = mainAccount.id;

    const appState = createAppAction(connectAppExec).useHook(reduxDevice, {
      account: isACRE ? undefined : mainAccount, // Bypass derivation check with ACRE as we can use other addresses than the freshest
      appName,
      dependencies,
      requireLatestFirmware,
    });
    const { device, opened, inWrongDeviceForAccount, error } = appState;
    const [state, setState] = useState(initialState);

    /**
     * Transaction observability: the sign-prompt drop-off. Failures and broadcast outcomes
     * are captured wide at the bridge seam, but a user closing the modal is an unsubscribe
     * rather than an error, so the bridge cannot see it — only this layer can.
     */
    const promptShownRef = useRef(false);
    const settledRef = useRef(false);
    const buildCommon = useCallback(
      () =>
        buildSignCommonEvent({
          // The signing account, which may be a TokenAccount — that is where the token id and
          // ticker come from. `mainAccount` supplies the chain and family.
          account: txRequest.account,
          mainAccount,
          pathway: manifestId
            ? TransactionPathway.WalletApiSignAndBroadcast
            : TransactionPathway.Send,
          manifestId,
          transaction,
        }),
      [txRequest.account, mainAccount, manifestId, transaction],
    );
    const buildCommonRef = useRef(buildCommon);
    buildCommonRef.current = buildCommon;

    useEffect(() => {
      if (state.deviceSignatureRequested) promptShownRef.current = true;
    }, [state.deviceSignatureRequested]);

    useEffect(() => {
      if (state.signedOperation || state.transactionSignError) settledRef.current = true;
    }, [state.signedOperation, state.transactionSignError]);

    // Unmount-only (empty deps), so an effect re-run is not mistaken for the user leaving.
    useEffect(
      () => () => {
        if (promptShownRef.current && !settledRef.current) {
          emitTransactionEvent(buildTransactionAbandonedEvent(buildCommonRef.current()));
        }
      },
      [],
    );

    useEffect(() => {
      if (!device || !opened || inWrongDeviceForAccount || error) {
        setState(initialState);
        // The attempt ended without the user dismissing anything — the device went away, or was
        // the wrong one. Clearing both refs stops that being reported later as a dismissal, and
        // leaves a retry on the same screen starting from a clean slate.
        promptShownRef.current = false;
        settledRef.current = false;
        return;
      }

      let cancelled = false;
      let sub: { unsubscribe: () => void } | undefined;
      (async () => {
        const signingAccount = mainAccountRef.current;
        const bridge = isACRE
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ACREBridge.accountBridge as unknown as AccountBridge<any>)
          : await getAccountBridge(signingAccount);
        if (cancelled) return;
        sub = bridge
          .signOperation({
            account: signingAccount,
            transaction,
            deviceId: device.deviceId,
            deviceModelId: device.modelId,
          })
          .pipe(
            catchError(error =>
              of<{ type: "error"; error: Error }>({
                type: "error",
                error,
              }),
            ),
            tap((e: Event) => log("actions-transaction-event", e.type, e)),
            scan(reducer, initialState),
          )
          .subscribe((x: any) => setState(x));
      })();
      return () => {
        cancelled = true;
        sub?.unsubscribe();
      };
    }, [device, mainAccountId, transaction, opened, inWrongDeviceForAccount, error, isACRE]);
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
