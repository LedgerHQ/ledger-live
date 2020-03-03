// @flow
import { of, Observable } from "rxjs";
import { scan, catchError, tap } from "rxjs/operators";
import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import { TransportStatusError } from "@ledgerhq/errors";
import type {
  TokenCurrency,
  AccountLike,
  Account,
  Transaction,
  TransactionStatus,
  SignedOperation,
  SignOperationEvent
} from "../../types";
import { TransactionRefusedOnDevice } from "../../errors";
import { getMainAccount } from "../../account";
import { getAccountBridge } from "../../bridge";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./shared";
import type { AppState } from "./app";
import { createAction as createAppAction } from "./app";

type State = {|
  signedOperation: ?SignedOperation,
  deviceSignatureRequested: boolean,
  deviceStreamingProgress: ?number,
  transactionSignError: ?Error
|};

type TransactionState = {|
  ...AppState,
  ...State
|};

type TransactionRequest = {
  tokenCurrency?: ?TokenCurrency,
  parentAccount: ?Account,
  account: AccountLike,
  transaction: Transaction,
  status: TransactionStatus
};

type TransactionResult =
  | {
      signedOperation: SignedOperation,
      device: Device
    }
  | {
      transactionSignError: Error
    };

type TransactionAction = Action<
  TransactionRequest,
  TransactionState,
  TransactionResult
>;

const mapResult = ({
  device,
  signedOperation,
  transactionSignError
}: TransactionState): ?TransactionResult =>
  signedOperation && device
    ? { signedOperation, device }
    : transactionSignError
    ? { transactionSignError }
    : null;

type Event = SignOperationEvent | { type: "error", error: Error };

const initialState = {
  signedOperation: null,
  deviceSignatureRequested: false,
  deviceStreamingProgress: null,
  transactionSignError: null
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
  }
  return state;
};

export const createAction = (
  connectAppExec: ConnectAppInput => Observable<ConnectAppEvent>
): TransactionAction => {
  const useHook = (
    reduxDevice: ?Device,
    txRequest: TransactionRequest
  ): TransactionState => {
    const { transaction } = txRequest;
    const mainAccount = getMainAccount(
      txRequest.account,
      txRequest.parentAccount
    );

    const appState = createAppAction(connectAppExec).useHook(reduxDevice, {
      account: mainAccount
    });

    const { device, opened } = appState;

    const [state, setState] = useState(initialState);

    useEffect(() => {
      if (!device || !opened) {
        setState(initialState);
        return;
      }

      const bridge = getAccountBridge(mainAccount);

      const sub = bridge
        .signOperation({
          account: mainAccount,
          transaction,
          deviceId: device.path
        })
        .pipe(
          catchError(error => of({ type: "error", error })),
          tap(e => log("actions-transaction-event", e.type, e)),
          scan(reducer, initialState)
        )
        .subscribe(setState);

      return () => {
        sub.unsubscribe();
      };
    }, [device, mainAccount, transaction, opened]);

    return {
      ...appState,
      ...state,
      deviceStreamingProgress:
        state.signedOperation || state.transactionSignError
          ? null
          : // when good app is opened, we start the progress so it doesn't "blink"
            state.deviceStreamingProgress || (appState.opened ? 0 : null)
    };
  };

  return {
    useHook,
    mapResult
  };
};
