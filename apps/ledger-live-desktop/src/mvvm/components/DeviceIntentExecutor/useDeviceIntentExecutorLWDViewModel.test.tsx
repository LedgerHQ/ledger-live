import { act, renderHook } from "@testing-library/react";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
  DeviceIntentExecutorProps,
  ExecutorState,
} from "@features/platform-device-intent";
import { ledgerToDmkDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import type { InitializerConfig } from "./DeviceContextInitializerComponentLWD";
import type { InitializationInput } from "./types";
import { PAGE_DEVICE_ACTION } from "./utils/trackDeviceIntent";
import { useDeviceIntentExecutorLWDViewModel } from "./useDeviceIntentExecutorLWDViewModel";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

jest.mock("~/renderer/components/DeviceAction/DeviceBlocker", () => ({
  useDeviceBlocked: jest.fn(),
}));

const mockedTrack = jest.mocked(track);
const mockedUseDeviceBlocked = jest.mocked(useDeviceBlocked);

const layerABaseProperties = {
  deviceUxV2: true,
};

type Props = DeviceIntentExecutorProps<unknown, unknown, unknown, InitializationInput> & {
  initializerConfig?: InitializerConfig;
  sourceFlow: "swap";
  analyticsProperties?: Record<string, string | number | boolean | undefined>;
};

function makeProps(overrides: Partial<Props> = {}): Props {
  return {
    deviceConnectionParams: {} as Props["deviceConnectionParams"],
    deviceInitializationInput: {} as InitializationInput,
    onExecutorStateChanged: jest.fn(),
    intent: {} as Props["intent"],
    intentComponentExtraProps: undefined,
    onIntentJobStateChanged: jest.fn(),
    onIntentJobComplete: jest.fn(),
    onIntentJobError: jest.fn(),
    enabled: true,
    onUserCancel: jest.fn(),
    cancelIntentRequestId: undefined,
    sourceFlow: "swap",
    ...overrides,
  };
}

function renderViewModel(initialProps?: Partial<Props>) {
  let props = makeProps(initialProps);
  const { result, rerender, unmount } = renderHook(() =>
    useDeviceIntentExecutorLWDViewModel(props),
  );
  const rerenderWithProps = (overrides: Partial<Props>) => {
    props = { ...props, ...overrides };
    rerender(undefined);
  };

  return { result, rerender, rerenderWithProps, unmount, props };
}

function makeConnectionResult(
  overrides: Partial<DeviceConnectionResult["connectedDevice"]> = {},
): DeviceConnectionResult {
  return {
    connectedDevice: {
      modelId: ledgerToDmkDeviceIdMap[DeviceModelId.stax],
      type: "BLE",
      ...overrides,
    },
  } as DeviceConnectionResult;
}

const TEST_EXTRACTED_CONTEXT = {} as DeviceExtractedContext;

function executingIntentState(
  connectionResult: DeviceConnectionResult = makeConnectionResult(),
): ExecutorState {
  return {
    type: "executingIntent",
    connectionResult,
    extractedContext: TEST_EXTRACTED_CONTEXT,
  };
}

describe("useDeviceIntentExecutorLWDViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentRouteNameRef.current = "Connect Device - Connecting";
    mockedUseDeviceBlocked.mockReturnValue(false);
  });

  describe("GIVEN the ViewModel mounts", () => {
    describe("GIVEN a device action is blocked", () => {
      beforeEach(() => {
        mockedUseDeviceBlocked.mockReturnValue(true);
      });

      it("WHEN the dialog requests to close THEN it does not cancel the flow", () => {
        const { result, props } = renderViewModel();

        result.current.onOpenChange(false);

        expect(props.onUserCancel).not.toHaveBeenCalled();
      });

      it("WHEN the overlay is pressed THEN it prevents dismissal", () => {
        const { result } = renderViewModel();
        const preventDefault = jest.fn();

        result.current.onOverlayDismiss({ preventDefault });

        expect(preventDefault).toHaveBeenCalledTimes(1);
      });

      it("WHEN Escape is pressed THEN it prevents dismissal", () => {
        const { result } = renderViewModel();
        const preventDefault = jest.fn();

        result.current.onEscapeKeyDown({ preventDefault });

        expect(preventDefault).toHaveBeenCalledTimes(1);
      });

      it("THEN it does not provide a header close handler", () => {
        const { result } = renderViewModel();

        expect(result.current.onHeaderClosePressed).toBeUndefined();
      });
    });

    it("WHEN the hook renders again THEN it fires deviceflow_started exactly once with the sourceFlow", () => {
      const { rerender } = renderViewModel();
      rerender(undefined);

      const startedCalls = mockedTrack.mock.calls.filter(
        ([eventName]) => eventName === "deviceflow_started",
      );
      expect(startedCalls).toHaveLength(1);
      expect(startedCalls[0]).toEqual([
        "deviceflow_started",
        { ...layerABaseProperties, sourceFlow: "swap" },
      ]);
    });

    it("WHEN the executor is disabled THEN it does not fire deviceflow_started", () => {
      renderViewModel({ enabled: false });

      expect(mockedTrack).not.toHaveBeenCalledWith("deviceflow_started", expect.anything());
    });
  });

  describe("GIVEN a disabled ViewModel", () => {
    it("WHEN the executor is enabled THEN it fires deviceflow_started", () => {
      const { rerenderWithProps } = renderViewModel({ enabled: false });
      mockedTrack.mockClear();

      rerenderWithProps({ enabled: true });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_started", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
    });
  });

  describe("GIVEN the executor reaches executingIntent for the first time", () => {
    it("WHEN the connection result is BLE THEN it fires app_ready THEN deviceflow_completed with the data carried by the state", () => {
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(
          executingIntentState(
            makeConnectionResult({
              modelId: ledgerToDmkDeviceIdMap[DeviceModelId.stax],
              type: "BLE",
            }),
          ),
        );
      });

      expect(mockedTrack).toHaveBeenNthCalledWith(1, "app_ready", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.stax,
      });
      expect(mockedTrack).toHaveBeenNthCalledWith(2, "deviceflow_completed", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.stax,
        transport: "ble",
      });
    });

    it("WHEN the connection result is USB THEN deviceflow_completed reports transport: usb", () => {
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(
          executingIntentState(
            makeConnectionResult({
              modelId: ledgerToDmkDeviceIdMap[DeviceModelId.nanoX],
              type: "USB",
            }),
          ),
        );
      });

      expect(mockedTrack).toHaveBeenNthCalledWith(1, "app_ready", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.nanoX,
      });
      expect(mockedTrack).toHaveBeenNthCalledWith(2, "deviceflow_completed", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.nanoX,
        transport: "usb",
      });
    });

    it("THEN it forwards the executor state to the original onExecutorStateChanged", () => {
      const onExecutorStateChanged = jest.fn();
      const { result } = renderViewModel({ onExecutorStateChanged });
      const state = executingIntentState();

      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(state);
      });

      expect(onExecutorStateChanged).toHaveBeenCalledWith(state);
    });
  });

  describe("GIVEN the executor enters executingIntent a second time", () => {
    it("THEN it does not re-fire app_ready / deviceflow_completed", () => {
      const { result } = renderViewModel();
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });

      expect(mockedTrack).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a completed flow is disabled and reenabled", () => {
    it("WHEN the executor reaches executingIntent again THEN it tracks the new flow completion", () => {
      const { result, rerenderWithProps } = renderViewModel();
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });
      rerenderWithProps({ enabled: false });
      rerenderWithProps({ enabled: true });
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });

      expect(mockedTrack).toHaveBeenNthCalledWith(1, "app_ready", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.stax,
      });
      expect(mockedTrack).toHaveBeenNthCalledWith(2, "deviceflow_completed", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.stax,
        transport: "ble",
      });
    });

    it("WHEN the user cancels before executingIntent again THEN it tracks the new flow cancellation", () => {
      const onUserCancel = jest.fn();
      const { result, rerenderWithProps } = renderViewModel({ onUserCancel });
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });
      rerenderWithProps({ enabled: false });
      rerenderWithProps({ enabled: true });
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
      expect(onUserCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("GIVEN a non-completing executor state", () => {
    const nonCompleting: ExecutorState[] = [
      { type: "connectingDevice", disableAutoConnect: false },
      { type: "deviceDisconnected", device: makeConnectionResult().connectedDevice },
      { type: "initializingDeviceContext", connectionResult: makeConnectionResult() },
      { type: "idle" },
    ];

    it.each(nonCompleting)("WHEN state is $type THEN no additional Layer A event fires", state => {
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(state);
      });

      expect(mockedTrack).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN the dialog dismiss interaction is triggered", () => {
    it("WHEN the header close button is pressed THEN it tracks the Close button click", () => {
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      act(() => {
        result.current.onHeaderClosePressed?.();
      });

      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        button: "Close",
      });
    });

    it("WHEN the overlay is pressed THEN it tracks the Close button click", () => {
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      act(() => {
        result.current.onOverlayDismiss({ preventDefault: jest.fn() });
      });

      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        button: "Close",
      });
    });

    it("WHEN Escape is pressed THEN it tracks the Close button click", () => {
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      act(() => {
        result.current.onEscapeKeyDown({ preventDefault: jest.fn() });
      });

      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        button: "Close",
      });
    });

    it("WHEN the user cancels (onOpenChange) THEN it does NOT track the Close button click", () => {
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      act(() => {
        result.current.onOpenChange(false);
      });

      expect(mockedTrack).not.toHaveBeenCalledWith("button_clicked", expect.anything());
    });
  });

  describe("GIVEN a ViewModel that has not yet completed", () => {
    it("WHEN the user cancels from a non-blocking page THEN it fires deviceflow_aborted and forwards to the original onUserCancel", () => {
      const onUserCancel = jest.fn();
      const { result } = renderViewModel({ onUserCancel });

      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
      expect(onUserCancel).toHaveBeenCalledTimes(1);
    });

    it("WHEN the user cancels from a shell error page THEN it fires deviceflow_failed and forwards to the original onUserCancel", () => {
      currentRouteNameRef.current = PAGE_DEVICE_ACTION.Disconnected;
      const onUserCancel = jest.fn();
      const { result } = renderViewModel({ onUserCancel });

      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
      expect(onUserCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("GIVEN a ViewModel that has already completed (executingIntent observed)", () => {
    it("WHEN the user cancels THEN it does NOT fire deviceflow_aborted but still forwards to the original onUserCancel", () => {
      const onUserCancel = jest.fn();
      const { result } = renderViewModel({ onUserCancel });
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      expect(mockedTrack).not.toHaveBeenCalledWith("deviceflow_aborted", expect.anything());
      expect(onUserCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("GIVEN analyticsProperties (e.g. wallet-api manifest) are provided", () => {
    const MANIFEST_PROPS = { manifestId: "swap-live-app", manifestName: "Swap" };

    it("WHEN the flow starts THEN deviceflow_started is enriched with the analytics properties", () => {
      renderViewModel({ analyticsProperties: MANIFEST_PROPS });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_started", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        ...MANIFEST_PROPS,
      });
    });

    it("WHEN executingIntent is reached THEN app_ready and deviceflow_completed are enriched", () => {
      const { result } = renderViewModel({ analyticsProperties: MANIFEST_PROPS });
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });

      expect(mockedTrack).toHaveBeenNthCalledWith(1, "app_ready", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.stax,
        ...MANIFEST_PROPS,
      });
      expect(mockedTrack).toHaveBeenNthCalledWith(2, "deviceflow_completed", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        modelId: DeviceModelId.stax,
        transport: "ble",
        ...MANIFEST_PROPS,
      });
    });

    it("WHEN the dialog is closed THEN the Close button_clicked is enriched", () => {
      const { result } = renderViewModel({ analyticsProperties: MANIFEST_PROPS });
      mockedTrack.mockClear();

      act(() => {
        result.current.onHeaderClosePressed?.();
      });

      expect(mockedTrack).toHaveBeenCalledWith("button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        button: "Close",
        ...MANIFEST_PROPS,
      });
    });

    it("WHEN the user cancels before completion THEN deviceflow_aborted is enriched", () => {
      const { result } = renderViewModel({ analyticsProperties: MANIFEST_PROPS });
      mockedTrack.mockClear();

      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        ...MANIFEST_PROPS,
      });
    });
  });
});
