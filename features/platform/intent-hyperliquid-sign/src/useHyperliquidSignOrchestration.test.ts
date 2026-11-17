import { act, renderHook, waitFor } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { hyperliquidSignIntentDefinition } from "./intentDefinition";
import type { HyperliquidSignIntentPlatformDefinition, HyperliquidSignIntentResult } from "./types";
import {
  useHyperliquidSignOrchestration,
  type HyperliquidSignOrchestrationRequest,
} from "./useHyperliquidSignOrchestration";

const INIT_INPUT = { appName: "Hyperliquid", dependencies: [], requireLatestFirmware: false };
const SIGNATURES = [{ r: "0xr", s: "0xs", v: 27 }];

const mockPlatformDefinition: HyperliquidSignIntentPlatformDefinition = {
  ...hyperliquidSignIntentDefinition,
  component: () => null,
};

function makeRequest(
  overrides: Partial<HyperliquidSignOrchestrationRequest> = {},
): HyperliquidSignOrchestrationRequest {
  return {
    appOptions: {
      requireLatestFirmware: true,
      allowPartialDependencies: false,
    },
    signOnSession: jest.fn().mockResolvedValue({ signatures: SIGNATURES }),
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
}

async function renderOrchestration(
  request = makeRequest(),
  buildDeviceInitializationInput = jest.fn().mockResolvedValue(INIT_INPUT),
) {
  const onClose = jest.fn();
  const view = renderHook(
    ({ req }) =>
      useHyperliquidSignOrchestration({
        request: req,
        platformDefinition: mockPlatformDefinition,
        buildDeviceInitializationInput,
        onClose,
      }),
    { initialProps: { req: request } },
  );
  await waitFor(() => expect(view.result.current.deviceInitializationInput).not.toBeNull());

  const finishJob = (result: HyperliquidSignIntentResult) =>
    act(() => {
      view.result.current.intent.onResult?.(result);
      view.result.current.onIntentJobComplete();
    });

  return { ...view, request, onClose, buildDeviceInitializationInput, finishJob };
}

describe("useHyperliquidSignOrchestration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should resolve the Hyperliquid app initialization input with the request's options", async () => {
    const { result, buildDeviceInitializationInput } = await renderOrchestration();

    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: {
        appName: "Hyperliquid",
        requireLatestFirmware: true,
        allowPartialDependencies: false,
      },
    });
    expect(result.current.deviceInitializationInput).toBe(INIT_INPUT);
  });

  it("should keep the initialization input when callback identities change", async () => {
    const request = makeRequest();
    const { result, rerender, buildDeviceInitializationInput } = await renderOrchestration(request);
    const initialInput = result.current.deviceInitializationInput;

    rerender({ req: { ...request, onSuccess: jest.fn(), onError: jest.fn() } });

    expect(buildDeviceInitializationInput).toHaveBeenCalledTimes(1);
    expect(result.current.deviceInitializationInput).toBe(initialInput);
  });

  it("should answer with the latest onSuccess after a re-render", async () => {
    const request = makeRequest();
    const latestOnSuccess = jest.fn();
    const { rerender, finishJob } = await renderOrchestration(request);

    rerender({ req: { ...request, onSuccess: latestOnSuccess } });
    finishJob({ type: "signed", signatures: SIGNATURES });

    expect(request.onSuccess).not.toHaveBeenCalled();
    expect(latestOnSuccess).toHaveBeenCalledWith({ signatures: SIGNATURES });
  });

  it("should forward the executor session and abort signal to request.signOnSession and unwrap signatures", async () => {
    const { result, request } = await renderOrchestration();
    const session = {
      dmk: {} as never,
      sessionId: "session-1",
      connectedDevice: { modelId: DeviceModelId.STAX } as never,
    };
    const { signal } = new AbortController();

    const signatures = await result.current.intent.input.signOnSession(session, signal);

    expect(request.signOnSession).toHaveBeenCalledWith(session, signal);
    expect(signatures).toEqual(SIGNATURES);
  });

  it("should call onSuccess with signatures and close once signed", async () => {
    const { request, onClose, finishJob } = await renderOrchestration();

    finishJob({ type: "signed", signatures: SIGNATURES });

    expect(request.onSuccess).toHaveBeenCalledWith({ signatures: SIGNATURES });
    expect(request.onError).not.toHaveBeenCalled();
    expect(request.onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["refusal", { type: "refused", error: new Error("refused") }],
    ["failure", { type: "failed", error: new Error("certificate not found") }],
  ] as const)("should call onError with the %s and close", async (_, outcome) => {
    const { request, onClose, finishJob } = await renderOrchestration();

    finishJob(outcome);

    expect(request.onError).toHaveBeenCalledTimes(1);
    expect(request.onError).toHaveBeenCalledWith(outcome.error);
    expect(request.onSuccess).not.toHaveBeenCalled();
    expect(request.onCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel and close when dismissed before a result", async () => {
    const { result, request, onClose } = await renderOrchestration();

    act(() => result.current.onUserCancel());

    expect(request.onCancel).toHaveBeenCalledTimes(1);
    expect(request.onError).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onCancel when unmounted before a result", async () => {
    const { unmount, request } = await renderOrchestration();

    unmount();

    expect(request.onCancel).toHaveBeenCalledTimes(1);
  });

  it("should not cancel on re-render when callback identities change, and should call the latest onCancel on unmount", async () => {
    const firstOnCancel = jest.fn();
    const secondOnCancel = jest.fn();
    const request = makeRequest({ onCancel: firstOnCancel });
    const { rerender, unmount } = await renderOrchestration(request);

    rerender({ req: { ...request, onCancel: secondOnCancel } });

    expect(firstOnCancel).not.toHaveBeenCalled();
    expect(secondOnCancel).not.toHaveBeenCalled();

    unmount();

    expect(firstOnCancel).not.toHaveBeenCalled();
    expect(secondOnCancel).toHaveBeenCalledTimes(1);
  });

  it("should not settle again when unmounted after signing", async () => {
    const { unmount, request, finishJob } = await renderOrchestration();
    finishJob({ type: "signed", signatures: SIGNATURES });

    unmount();

    expect(request.onCancel).not.toHaveBeenCalled();
    expect(request.onError).not.toHaveBeenCalled();
  });

  it("should call onError and close when app requirements fail to resolve", async () => {
    const failure = new Error("network down");
    const buildDeviceInitializationInput = jest.fn().mockRejectedValue(failure);
    const request = makeRequest();
    const onClose = jest.fn();

    renderHook(() =>
      useHyperliquidSignOrchestration({
        request,
        platformDefinition: mockPlatformDefinition,
        buildDeviceInitializationInput,
        onClose,
      }),
    );

    await waitFor(() => expect(request.onError).toHaveBeenCalledWith(failure));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
