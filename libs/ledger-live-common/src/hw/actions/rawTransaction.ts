import { of, Observable } from "rxjs";
import { scan, catchError, tap } from "rxjs/operators";
import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import { TransportStatusError } from "@ledgerhq/errors";
import { TransactionRefusedOnDevice } from "../../errors";
import { getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./types";
import type { AppRequest, AppState } from "./app";
import { createAction as createAppAction } from "./app";
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
}: RawTransactionState): RawTransactionResult | null | undefined =>
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
        error instanceof TransportStatusError && error.statusCode === 0x6985
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
    const appState = createAppAction(connectAppExec).useHook(reduxDevice, {
      account: mainAccount,
      appName,
      dependencies,
      requireLatestFirmware,
    });
    const { device, opened, inWrongDeviceForAccount, error } = appState;
    const [state, setState] = useState(initialState);
    useEffect(() => {
      if (!device || !opened || inWrongDeviceForAccount || error) {
        setState(initialState);
        return;
      }

      const bridge = getAccountBridge(mainAccount);
      const sub = bridge
        .signRawOperation({
          account: mainAccount,
          transaction,
          deviceId: device.deviceId,
          deviceModelId: device.modelId,
          broadcast,
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
      return () => {
        sub.unsubscribe();
      };
    }, [device, mainAccount, transaction, broadcast, opened, inWrongDeviceForAccount, error]);
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
