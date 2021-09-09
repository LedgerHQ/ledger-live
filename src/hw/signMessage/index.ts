import invariant from "invariant";
import {
  DeviceAppVerifyNotSupported,
  UserRefusedAddress,
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Observable } from "rxjs";
import type { Resolver } from "./types";
import perFamily from "../../generated/hw-signMessage";
import { useState, useEffect, useCallback, useRef } from "react";
import { from } from "rxjs";
import { createAction as createAppAction } from "../actions/app";
import type { AppRequest, AppState } from "../actions/app";
import type { Device } from "../actions/types";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import { withDevice } from "../deviceAccess";
import type { MessageData, Result } from "./types";

const dispatch: Resolver = (transport, opts) => {
  const { currency, verify } = opts;
  const getAddress = perFamily[currency.family];
  invariant(getAddress, `signMessage is not implemented for ${currency.id}`);
  return getAddress(transport, opts)
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
  const result: Observable<Result> = withDevice(deviceId)((t) =>
    from(dispatch(t, request.message))
  );
  return result;
};
const initialState: BaseState = {
  signMessageRequested: null,
  signMessageError: null,
  signMessageResult: null,
};
export const createAction = (
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>,
  signMessage: (arg0: Input) => Observable<Result> = signMessageExec
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
    mapResult: (r: State) => ({
      signature: r.signMessageResult,
      error: r.signMessageError,
    }),
  };
};
export default dispatch;
