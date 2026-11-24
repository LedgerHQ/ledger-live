import { act, renderHook, waitFor } from "@tests/test-renderer";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { SignedOperation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createIntent } from "@features/platform-device-intent";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useRawTransactionSignatureDrawerViewModel } from "./useRawTransactionSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignRawRequest } from "./types";

jest.mock("@features/platform-device-intent", () => ({
  createIntent: jest.fn(() => ({ uuid: "intent-1" })),
}));

jest.mock("@ledgerhq/live-common/device-action/utils", () => ({
  FlowName: { unknown: "unknown" },
}));

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Hashi" })),
}));

jest.mock("./intentDefinition", () => ({
  signRawTransactionIntentPlatformDefinition: { label: "Sign raw transaction" },
}));

const mockedBuildInput = jest.mocked(buildDeviceInitializationInput);
const mockedCreateIntent = jest.mocked(createIntent);

const account = {
  id: "js:2:bitcoin:xpub:native_segwit",
  type: "Account",
  currency: getCryptoCurrencyById("bitcoin"),
};
const signedOperation = { operation: { id: "op-1" } } as unknown as SignedOperation;

function setup(apps: { appName?: string; dependencies?: string[] } = { appName: "Hashi" }) {
  const onSuccess = jest.fn();
  const onError = jest.fn();
  const onClose = jest.fn();

  const request = {
    account,
    parentAccount: undefined,
    transaction: "cHNidP8BAA==",
    broadcast: true,
    appName: apps.appName,
    dependencies: apps.dependencies,
    manifestId: "ledger-wallet-connect",
    manifestName: "WalletConnect",
    onSuccess,
    onError,
  } as unknown as WalletApiDeviceIntentSignRawRequest;

  const utils = renderHook(() => useRawTransactionSignatureDrawerViewModel({ request, onClose }));
  return { ...utils, onSuccess, onError, onClose };
}

describe("useRawTransactionSignatureDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens an app allowed in place of the account's app without requiring the account's app", async () => {
    const { result } = setup({ appName: "Hashi", dependencies: ["Exchange"] });

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    expect(mockedBuildInput).toHaveBeenCalledWith({
      appRequest: { account, appName: "Hashi", dependencies: [{ appName: "Exchange" }] },
      flow: "unknown",
    });
  });

  it.each([
    { appName: undefined, dependencies: ["Bitcoin", "Exchange"] },
    { appName: "", dependencies: ["Exchange"] },
    { appName: "Bitcoin", dependencies: ["Exchange"] },
  ])(
    "does not make the opened account app its own dependency ($appName)",
    async ({ appName, dependencies }) => {
      const { result } = setup({ appName, dependencies });

      await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

      expect(mockedBuildInput).toHaveBeenCalledWith({
        appRequest: { account, appName, dependencies: [{ appName: "Exchange" }] },
        flow: "unknown",
      });
    },
  );

  it("requires the account's app when the dApp names another app", async () => {
    const { result } = setup({ appName: "Other" });

    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    expect(mockedBuildInput).toHaveBeenCalledWith({
      appRequest: { account, appName: "Other", dependencies: [{ currency: account.currency }] },
      flow: "unknown",
    });
  });

  it("builds the raw signature intent with the transaction and broadcast", () => {
    const { result } = setup();

    expect(mockedCreateIntent).toHaveBeenCalledWith(
      { label: "Sign raw transaction" },
      { account, parentAccount: undefined, transaction: "cHNidP8BAA==", broadcast: true },
    );
    expect(result.current.signatureIntent).toEqual({ uuid: "intent-1" });
  });

  it("resolves the wallet-api promise and closes the drawer on a signed job state", async () => {
    const { result, onSuccess, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signedOperation });
    });

    expect(onSuccess).toHaveBeenCalledWith(signedOperation);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with UserRefusedOnDevice and closes when the user dismisses before signing", async () => {
    const { result, onError, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onUserCancel();
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(UserRefusedOnDevice);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects and closes when building the device initialization input fails", async () => {
    const failure = new Error("build failed");
    mockedBuildInput.mockRejectedValueOnce(failure);

    const { onError, onClose } = setup();

    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects with the signing error when the user closes the error screen", async () => {
    const { result, onError, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());
    const signingError = new Error("Invalid PSBT");

    act(() => {
      result.current.onIntentJobError(signingError);
    });
    expect(onError).not.toHaveBeenCalled();

    act(() => {
      result.current.onUserCancel();
    });

    expect(onError).toHaveBeenCalledWith(signingError);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each(["connectingDevice", "initializingDeviceContext", "executingIntent"] as const)(
    "forgets the signing error once a retry reaches %s",
    async executorStateType => {
      const { result, onError } = setup();
      await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

      act(() => {
        result.current.onIntentJobError(new Error("Device disconnected"));
      });
      act(() => {
        result.current.onExecutorStateChanged({
          type: executorStateType,
        } as Parameters<typeof result.current.onExecutorStateChanged>[0]);
      });
      act(() => {
        result.current.onUserCancel();
      });

      expect(onError.mock.calls[0][0]).toBeInstanceOf(UserRefusedOnDevice);
    },
  );

  it("settles the request only once", async () => {
    const { result, onSuccess, onError, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signedOperation });
      result.current.onIntentJobStateChanged({ type: "signed", signedOperation });
      result.current.onUserCancel();
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
