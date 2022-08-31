import {
  DeviceAppVerifyNotSupported,
  UserRefusedAddress,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { useCallback, useEffect, useRef, useState } from "react";
import { from, Observable } from "rxjs";
import perFamily from "../../generated/hw-signMessage";
import { Account } from "@ledgerhq/types-live";
import type { AppRequest, AppState } from "../actions/app";
import { createAction as createAppAction } from "../actions/app";
import type { Device } from "../actions/types";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import { withDevice } from "../deviceAccess";
import type { MessageData, SignMessage, Result } from "./types";
import { DerivationMode } from "../../derivation";

export const prepareMessageToSign = (
  account: Account,
  message: string
): MessageData => {
  const { currency, freshAddressPath, derivationMode } = account;

  if (!perFamily[currency.family]) {
    throw new Error("Crypto does not support signMessage");
  }

  if ("prepareMessageToSign" in perFamily[currency.family]) {
    return perFamily[currency.family].prepareMessageToSign(
      currency,
      freshAddressPath,
      derivationMode,
      message
    );
  }

  // Default implementation
  return {
    currency: currency,
    path: freshAddressPath,
    derivationMode: derivationMode as DerivationMode,
    message: Buffer.from(message, "hex").toString(),
    rawMessage: "0x" + message,
  };
};

const signMessage: SignMessage = (transport, opts) => {
  const { currency, verify } = opts;
  const signMessage = perFamily[currency.family].signMessage;
  invariant(signMessage, `signMessage is not implemented for ${currency.id}`);
  return signMessage(transport, opts)
    .then((result) => {
      log(
        "hw",
        `signMessage ${currency.id} on ${opts.path} with message [${opts.message}]`,
        result
      );
      return result;
    })
    .catch((e) => {
      log(
        "hw",
        `signMessage ${currency.id} on ${opts.path} FAILED ${String(e)}`
      );

      if (e && e.name === "TransportStatusError") {
        if (e.statusCode === 0x6b00 && verify) {
          throw new DeviceAppVerifyNotSupported();
        }

        if (e.statusCode === 0x6985 || e.statusCode === 0x5501) {
          throw new UserRefusedAddress();
        }
      }

      throw e;
    });
};

type BaseState = {
  signMessageRequested: MessageData | null | undefined;
  signMessageError: Error | null | undefined;
  signMessageResult: string | null | undefined;
};

export type State = AppState & BaseState;
export type Request = AppRequest & {
  message: MessageData;
};

export type Input = {
  request: Request;
  deviceId: string;
};

export const signMessageExec = ({
  request,
  deviceId,
}: Input): Observable<Result> => {
  const result: Observable<Result> = withDevice(deviceId)((transport) =>
    from(signMessage(transport, request.message))
  );
  return result;
};

const initialState: BaseState = {
  signMessageRequested: null,
  signMessageError: null,
  signMessageResult: null,
};

export const createAction = (
  connectAppExec: (
    connectAppInput: ConnectAppInput
  ) => Observable<ConnectAppEvent>,
  signMessage: (input: Input) => Observable<Result> = signMessageExec
) => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    request: Request
  ): State => {
    const appState: AppState = createAppAction(connectAppExec).useHook(
      reduxDevice,
      {
        account: request.account,
      }
    );
    const { device, opened, inWrongDeviceForAccount, error } = appState;
    const [state, setState] = useState<BaseState>({
      ...initialState,
      signMessageRequested: request.message,
    });
    const signedFired = useRef<boolean>();

    const sign = useCallback(async () => {
      let result;

      if (!device) {
        setState({
          ...initialState,
          signMessageError: new Error("no Device"),
        });
        return;
      }

      try {
        result = await signMessage({
          request,
          deviceId: device.deviceId,
        }).toPromise();
      } catch (e: any) {
        if (e.name === "UserRefusedAddress") {
          e.name = "UserRefusedOnDevice";
          e.message = "UserRefusedOnDevice";
        }

        return setState({ ...initialState, signMessageError: e });
      }

      setState({ ...initialState, signMessageResult: result?.signature });
    }, [device, request]);

    useEffect(() => {
      if (!device || !opened || inWrongDeviceForAccount || error) {
        return;
      }

      if (state.signMessageRequested && !signedFired.current) {
        signedFired.current = true;
        sign();
      }
    }, [
      device,
      opened,
      inWrongDeviceForAccount,
      error,
      sign,
      state.signMessageRequested,
    ]);
    return { ...appState, ...state };
  };

  return {
    useHook,
    mapResult: (state: State) => ({
      signature: state.signMessageResult,
      error: state.signMessageError,
    }),
  };
};
export default signMessage;
