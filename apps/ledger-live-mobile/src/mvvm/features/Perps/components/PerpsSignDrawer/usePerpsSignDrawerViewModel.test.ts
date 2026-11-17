import { act, renderHook, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { PerpsSignRequest } from "@ledgerhq/live-common/wallet-api/Perps/server";
import type { HyperliquidSignIntentResult } from "@features/platform-intent-hyperliquid-sign";
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
  const view = renderHook(() =>
    usePerpsSignDrawerViewModel({
      request,
      manifestId: "perps-live-app",
      manifestName: "Perps",
      onClose,
    }),
  );
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

  it("should open the Hyperliquid app with the live app's firmware options", async () => {
    const { result } = await renderViewModel();

    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: {
        appName: "Hyperliquid",
        requireLatestFirmware: true,
        allowPartialDependencies: false,
      },
    });
    expect(result.current.deviceInitializationInput).toBe(INIT_INPUT);
    expect(result.current.analyticsProperties).toEqual({
      manifestId: "perps-live-app",
      manifestName: "Perps",
    });
  });

  it("should sign on the executor's session", async () => {
    const { result, request } = await renderViewModel();
    const session = {
      dmk: {} as never,
      sessionId: "session-1",
      connectedDevice: { modelId: DeviceModelId.FLEX } as never,
    };

    const { signal } = new AbortController();

    const signatures = await result.current.intent.input.signOnSession(session, signal);

    expect(request.signOnSession).toHaveBeenCalledWith(session, signal);
    expect(signatures).toEqual(SIGNATURES);
  });

  it("should answer with the signatures and close once signed", async () => {
    const { request, onClose, finishJob } = await renderViewModel();

    finishJob({ type: "signed", signatures: SIGNATURES });

    expect(request.onSuccess).toHaveBeenCalledWith({ signatures: SIGNATURES });
    expect(request.onError).not.toHaveBeenCalled();
    expect(request.onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["refusal", { type: "refused", error: new UserRefusedOnDevice() }],
    ["failure", { type: "failed", error: new Error("certificate not found") }],
  ] as const)("should answer with the %s and close", async (_, outcome) => {
    const { request, onClose, finishJob } = await renderViewModel();

    finishJob(outcome);

    expect(request.onError).toHaveBeenCalledTimes(1);
    expect(request.onError).toHaveBeenCalledWith(outcome.error);
    expect(request.onSuccess).not.toHaveBeenCalled();
    expect(request.onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel and close when dismissed before a result", async () => {
    const { result, request, onClose } = await renderViewModel();

    act(() => result.current.onUserCancel());

    expect(request.onCancel).toHaveBeenCalledTimes(1);
    expect(request.onError).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when unmounted before a result", async () => {
    const { unmount, request } = await renderViewModel();

    unmount();

    expect(request.onCancel).toHaveBeenCalledTimes(1);
  });

  it("should not answer again when unmounted after signing", async () => {
    const { unmount, request, finishJob } = await renderViewModel();
    finishJob({ type: "signed", signatures: SIGNATURES });

    unmount();

    expect(request.onCancel).not.toHaveBeenCalled();
    expect(request.onError).not.toHaveBeenCalled();
  });

  it("should answer with the error and close when the app requirements cannot be resolved", async () => {
    const failure = new Error("network down");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValue(failure);
    const request = makeRequest();
    const onClose = jest.fn();

    renderHook(() =>
      usePerpsSignDrawerViewModel({
        request,
        manifestId: "perps-live-app",
        manifestName: "Perps",
        onClose,
      }),
    );

    await waitFor(() => expect(request.onError).toHaveBeenCalledWith(failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
