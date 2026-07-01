import { act, renderHook, waitFor } from "@testing-library/react-native";
import { createIntent } from "@ledgerhq/device-intent";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { useMessageSignatureDrawerViewModel } from "./useMessageSignatureDrawerViewModel";
import type { WalletApiDeviceIntentSignMessageRequest } from "./types";

jest.mock("@ledgerhq/device-intent", () => ({
  createIntent: jest.fn(() => ({ uuid: "intent-1" })),
}));

jest.mock("@ledgerhq/live-common/account/index", () => ({
  getMainAccount: jest.fn((account: unknown) => account),
}));

jest.mock("@ledgerhq/live-common/device-action/utils", () => ({
  FlowName: { unknown: "unknown" },
}));

jest.mock("@ledgerhq/live-common/hw/actions/app", () => ({
  dependenciesToAppRequests: jest.fn((deps?: string[]) =>
    (deps ?? []).map(appName => ({ appName })),
  ),
}));

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Ethereum" })),
}));

jest.mock("./intentLWMDefinition", () => ({
  signMessageIntentLWMDefinition: { label: "Sign message" },
}));

const mockedBuildInput = jest.mocked(buildDeviceInitializationInput);
const mockedCreateIntent = jest.mocked(createIntent);

const account = {
  id: "js:2:ethereum:0xabc:",
  type: "Account",
  currency: { name: "Ethereum" },
};
const message = { standard: undefined, message: "hello" };

function setup(overrides?: {
  onSuccess?: jest.Mock;
  onError?: jest.Mock;
  onCancel?: jest.Mock;
  onClose?: jest.Mock;
}) {
  const onSuccess = overrides?.onSuccess ?? jest.fn();
  const onError = overrides?.onError ?? jest.fn();
  const onCancel = overrides?.onCancel ?? jest.fn();
  const onClose = overrides?.onClose ?? jest.fn();

  const request = {
    account,
    parentAccount: undefined,
    message,
    appName: undefined,
    dependencies: undefined,
    onSuccess,
    onError,
    onCancel,
  } as unknown as WalletApiDeviceIntentSignMessageRequest;

  const utils = renderHook(() => useMessageSignatureDrawerViewModel({ request, onClose }));
  return { ...utils, onSuccess, onError, onCancel, onClose };
}

describe("useMessageSignatureDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds the device initialization input and the signature intent", async () => {
    const { result } = setup();

    await waitFor(() =>
      expect(result.current.deviceInitializationInput).toEqual({ appName: "Ethereum" }),
    );

    expect(mockedBuildInput).toHaveBeenCalledWith(
      expect.objectContaining({
        appRequest: expect.objectContaining({ account }),
        flow: "unknown",
      }),
    );
    expect(mockedCreateIntent).toHaveBeenCalledWith(
      { label: "Sign message" },
      expect.objectContaining({ account, message }),
    );
    expect(result.current.signatureIntent).toEqual({ uuid: "intent-1" });
  });

  it("resolves the wallet-api promise with the signature and closes on a signed job state", async () => {
    const { result, onSuccess, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signature: "0xsignature" });
    });

    expect(onSuccess).toHaveBeenCalledWith("0xsignature");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("rejects via onCancel and closes when the user dismisses before signing", async () => {
    const { result, onCancel, onClose } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onUserCancel();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not reject when dismissed after signing already completed", async () => {
    const { result, onCancel } = setup();
    await waitFor(() => expect(result.current.deviceInitializationInput).not.toBeNull());

    act(() => {
      result.current.onIntentJobStateChanged({ type: "signed", signature: "0xsignature" });
    });
    act(() => {
      result.current.onUserCancel();
    });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("rejects and closes when building the device initialization input fails", async () => {
    const failure = new Error("build failed");
    mockedBuildInput.mockRejectedValueOnce(failure);

    const { onError, onClose } = setup();

    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
