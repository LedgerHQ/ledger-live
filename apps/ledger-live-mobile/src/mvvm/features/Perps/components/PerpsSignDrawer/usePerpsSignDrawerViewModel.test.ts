import { act, renderHook, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { HyperliquidSignIntentResult } from "@features/platform-hyperliquid-sign-intent";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { usePerpsSignDrawerViewModel } from "./usePerpsSignDrawerViewModel";

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
}));

jest.mock("../../deviceIntents/hyperliquidSignIntent/intentLWMDefinition", () => ({
  hyperliquidSignIntentLWMDefinition: { label: "Sign Hyperliquid actions" },
}));

const INIT_INPUT = { appName: "Hyperliquid", dependencies: [], requireLatestFirmware: false };
const SIGNATURES = [{ r: "0xr", s: "0xs", v: 27 }];

function makeRequest(overrides: Partial<PerpsSignRequest> = {}): PerpsSignRequest {
  return {
    appName: "Hyperliquid",
    appOptions: {
      requireLatestFirmware: true,
      allowPartialDependencies: false,
      skipAppInstallIfNotFound: false,
    },
    signFactory: jest.fn(),
    signOnSession: jest.fn().mockResolvedValue({ signatures: SIGNATURES }),
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
}

async function renderViewModel(request = makeRequest()) {
  const onClose = jest.fn();
  const view = renderHook(() => usePerpsSignDrawerViewModel({ request, onClose }));
  await waitFor(() => expect(view.result.current.deviceInitializationInput).not.toBeNull());

  const finishJob = (result: HyperliquidSignIntentResult) =>
    act(() => {
      view.result.current.intent.onResult?.(result);
      view.result.current.onIntentJobComplete();
    });

  return { ...view, request, onClose, finishJob };
}

describe("usePerpsSignDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INIT_INPUT);
  });

  it("opens the Hyperliquid app with the live app's firmware options", async () => {
    const { result } = await renderViewModel();

    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: {
        appName: "Hyperliquid",
        requireLatestFirmware: true,
        allowPartialDependencies: false,
      },
    });
    expect(result.current.deviceInitializationInput).toBe(INIT_INPUT);
  });

  it("signs on the executor's session with the Ledger device model", async () => {
    const { result, request } = await renderViewModel();
    const session = {
      dmk: {} as never,
      sessionId: "session-1",
      connectedDevice: { modelId: DeviceModelId.FLEX } as never,
    };

    const signatures = await result.current.intent.input.signOnSession(session);

    expect(request.signOnSession).toHaveBeenCalledWith({
      dmk: session.dmk,
      sessionId: "session-1",
      deviceModelId: "europa",
    });
    expect(signatures).toEqual(SIGNATURES);
  });

  it("answers with the signatures and closes once signed", async () => {
    const { request, onClose, finishJob } = await renderViewModel();

    finishJob({ type: "signed", signatures: SIGNATURES });

    expect(request.onSuccess).toHaveBeenCalledWith({ signatures: SIGNATURES });
    expect(request.onError).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("answers with the refusal and keeps the refused screen open", async () => {
    const { result, request, onClose, finishJob } = await renderViewModel();
    const refusal = new UserRefusedOnDevice();

    finishJob({ type: "refused", error: refusal });

    expect(request.onError).toHaveBeenCalledWith(refusal);
    expect(onClose).not.toHaveBeenCalled();

    act(() => result.current.onUserCancel());

    expect(request.onError).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("answers with the failure and keeps the error screen open", async () => {
    const { request, onClose, finishJob } = await renderViewModel();
    const failure = new Error("certificate not found");

    finishJob({ type: "failed", error: failure });

    expect(request.onError).toHaveBeenCalledWith(failure);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("answers with a refusal when closed before a result", async () => {
    const { result, request, onClose } = await renderViewModel();

    act(() => result.current.onUserCancel());

    expect(request.onError).toHaveBeenCalledWith(expect.any(UserRefusedOnDevice));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("answers with a refusal when unmounted before a result", async () => {
    const { unmount, request } = await renderViewModel();

    unmount();

    expect(request.onError).toHaveBeenCalledWith(expect.any(UserRefusedOnDevice));
  });

  it("does not answer again when unmounted after signing", async () => {
    const { unmount, request, finishJob } = await renderViewModel();
    finishJob({ type: "signed", signatures: SIGNATURES });

    unmount();

    expect(request.onError).not.toHaveBeenCalled();
  });

  it("answers with the error and closes when the app requirements cannot be resolved", async () => {
    const failure = new Error("network down");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValue(failure);
    const request = makeRequest();
    const onClose = jest.fn();

    renderHook(() => usePerpsSignDrawerViewModel({ request, onClose }));

    await waitFor(() => expect(request.onError).toHaveBeenCalledWith(failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
