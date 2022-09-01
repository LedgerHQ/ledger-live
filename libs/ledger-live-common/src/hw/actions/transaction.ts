import { of, Observable } from "rxjs";
import { scan, catchError, tap } from "rxjs/operators";
import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import { TransportStatusError } from "@ledgerhq/errors";
import type { Transaction, TransactionStatus } from "../../generated/types";
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
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
type State = {
  signedOperation: SignedOperation | null | undefined;
  deviceSignatureRequested: boolean;
  deviceStreamingProgress: number | null | undefined;
  transactionSignError: Error | null | undefined;
};
type TransactionState = AppState & State;
type TransactionRequest = {
  tokenCurrency?: TokenCurrency | null | undefined;
  parentAccount: Account | null | undefined;
  account: AccountLike;
  transaction: Transaction;
  status: TransactionStatus;
  appName?: string;
  dependencies?: AppRequest[];
  requireLatestFirmware?: boolean;
};
type TransactionResult =
  | {
      signedOperation: SignedOperation;
      device: Device;
      swapId?: string;
    }
  | {
      transactionSignError: Error;
    };
type TransactionAction = Action<
  TransactionRequest,
  TransactionState,
  TransactionResult
>;

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
};

const reducer = (state: State, e: Event): State => {
  switch (e.type) {
    case "error": {
      const { error } = e;
      const transactionSignError =
        // @ts-expect-error typescript doesn't check against the TransportStatusError type
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
  }

  return state;
};

export const createAction = (
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>
): TransactionAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    txRequest: TransactionRequest
  ): TransactionState => {
    const { transaction, appName, dependencies, requireLatestFirmware } =
      txRequest;
    const mainAccount = getMainAccount(
      txRequest.account,
      txRequest.parentAccount
    );
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
        .signOperation({
          account: mainAccount,
          transaction,
          deviceId: device.deviceId,
        })
        .pipe(
          catchError((error) =>
            of<{ type: "error"; error: Error }>({
              type: "error",
              error,
            })
          ),
          tap((e: Event) => log("actions-transaction-event", e.type, e)),
          scan(reducer, initialState)
        )
        .subscribe((x: any) => setState(x));
      return () => {
        sub.unsubscribe();
      };
    }, [
      device,
      mainAccount,
      transaction,
      opened,
      inWrongDeviceForAccount,
      error,
    ]);
    return {
      ...appState,
      ...state,
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
