import { useContext, useEffect, useState } from "react";
import { apiProxy } from "../_utils";
import { MockDeviceContext } from "../../../src/storybook/MockDeviceProvider";

type Payload = object;
type HookState = { appAndVersion: { flags: string } };
type ActionStatus = HookState & {
  payload: Payload;
  __extends: (s: Partial<ActionStatus>) => ActionStatus;
};

console.trace("LOG THIS");

const useHook = () => {
  const [result, setResult] = useState<ActionStatus>(defaultState);

  const status$ = useContext(MockDeviceContext);
  useEffect(() => {
    status$.subscribe(status => {
      switch (status.type) {
        case "LOADING":
          return setResult(result.__extends({ payload: status.payload }));
      }
    });
  }, [status$]);

  return result;
};

export function createAction() {
  return {
    useHook,
    mapResult: ({ payload }) => payload,
  };
}

const connectApp = undefined;
export default connectApp;

const defaultHookState = {
  isLoading: true,
  requestQuitApp: false,
  requestOpenApp: null,
  unresponsive: false,
  isLocked: false,
  requiresAppInstallation: null,
  allowOpeningRequestedWording: null,
  allowOpeningGranted: false,
  allowManagerRequested: false,
  allowManagerGranted: false,
  device: null,
  deviceInfo: null,
  latestFirmware: null,
  opened: false,
  appAndVersion: null,
  error: null,
  derivation: null,
  displayUpgradeWarning: false,
  installingApp: false,
  listingApps: false,
  installQueue: [],
  listedApps: false,
  skippedAppOps: [],
  itemProgress: 0,
  inWrongDeviceForAccount: null,
  signedOperation: null,
  deviceSignatureRequested: false,
  deviceStreamingProgress: null,
  transactionSignError: null,
  transactionChecksOptInTriggered: false,
  transactionChecksOptIn: null,
};

const defaultState = apiProxy<ActionStatus>("device status", {
  ...defaultHookState,
  payload: null,
});
