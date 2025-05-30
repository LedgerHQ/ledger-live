import { UserRefusedAddress } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { useCallback, useEffect, useRef, useState } from "react";
import { firstValueFrom, from, Observable } from "rxjs";
import { AcreMessageType } from "@ledgerhq/wallet-api-acre-module";
import { Account, AnyMessage } from "@ledgerhq/types-live";
import perFamily from "../../generated/hw-signMessage";
import type { AppRequest, AppState } from "../actions/app";
import { createAction as createAppAction } from "../actions/app";
import type { Device } from "../actions/types";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import { withDevice } from "../deviceAccess";
import type { SignMessage, Result } from "./types";
import { messageSigner as ACREMessageSigner } from "../../families/bitcoin/ACRESetup";

export const prepareMessageToSign = (account: Account, message: string): AnyMessage => {
  const utf8Message = Buffer.from(message, "hex").toString();

  if (!perFamily[account.currency.family]) {
    throw new Error("Crypto does not support signMessage");
  }

  if ("prepareMessageToSign" in perFamily[account.currency.family]) {
    return perFamily[account.currency.family].prepareMessageToSign({
      account,
      message: utf8Message,
    });
  }

  // Default implementation
  return { message: utf8Message };
};

const signMessage: SignMessage = (transport, account, opts) => {
  const { currency } = account;
  let signMessage = perFamily[currency.family].signMessage;
  if ("type" in opts) {
    switch (opts.type) {
      case AcreMessageType.Withdraw:
        signMessage = ACREMessageSigner.signWithdraw;
        break;
      case AcreMessageType.SignIn:
        signMessage = ACREMessageSigner.signIn;
        break;
      default:
        signMessage = ACREMessageSigner.signMessage;
        break;
    }
  }
  invariant(signMessage, `signMessage is not implemented for ${currency.id}`);
  return signMessage(transport, account, opts)
    .then(result => {
      const path = "path" in opts && opts.path ? opts.path : account.freshAddressPath;
      log("hw", `signMessage ${currency.id} on ${path} with message [${opts.message}]`, result);
      return result;
    })
    .catch(e => {
      const path = "path" in opts && opts.path ? opts.path : account.freshAddressPath;
      log("hw", `signMessage ${currency.id} on ${path} FAILED ${String(e)}`);

      if (e && e.name === "TransportStatusError") {
        if (e.statusCode === 0x6985 || e.statusCode === 0x5501) {
          throw new UserRefusedAddress();
        }
      }

      throw e;
    });
};

type BaseState = {
  signMessageRequested: AnyMessage | null | undefined;
  signMessageError: Error | null | undefined;
  signMessageResult: string | null | undefined;
};

export type State = AppState & BaseState;
export type Request = AppRequest & {
  message: AnyMessage;
  isACRE?: boolean;
};

export type Input = {
  request: Request;
  deviceId: string;
};

export const signMessageExec = ({ request, deviceId }: Input): Observable<Result> => {
  if (!request.account) {
    throw new Error("account is required");
  }

  const result: Observable<Result> = withDevice(deviceId)(transport =>
    from(signMessage(transport, request.account!, request.message)),
  );
  return result;
};

const initialState: BaseState = {
  signMessageRequested: null,
  signMessageError: null,
  signMessageResult: null,
};

export const createAction = (
  connectAppExec: (connectAppInput: ConnectAppInput) => Observable<ConnectAppEvent>,
  signMessage: (input: Input) => Observable<Result> = signMessageExec,
) => {
  const useHook = (reduxDevice: Device | null | undefined, request: Request): State => {
    const appState: AppState = createAppAction(connectAppExec).useHook(reduxDevice, {
      appName: request.appName,
      dependencies: request.dependencies,
      account: request.isACRE ? undefined : request.account, // Bypass derivation check with ACRE as we can use other addresses than the freshest
    });
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
        result = await firstValueFrom(
          signMessage({
            request,
            deviceId: device.deviceId,
          }),
        );
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
    }, [device, opened, inWrongDeviceForAccount, error, sign, state.signMessageRequested]);
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
