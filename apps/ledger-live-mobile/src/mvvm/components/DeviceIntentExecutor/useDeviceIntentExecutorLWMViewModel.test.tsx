import { act, renderHook } from "@tests/test-renderer";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
  DeviceIntentExecutorProps,
  ExecutorState,
} from "@ledgerhq/device-intent";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { track } from "~/analytics";
import { currentRouteNameRef } from "~/analytics/screenRefs";
import type { InitializerConfig } from "./DeviceContextInitializerComponentLWM";
import type { InitializationInput } from "./types";
import { PAGE_CONNECT_APP } from "./utils/trackDeviceIntent";
import { useDeviceIntentExecutorLWMViewModel } from "./useDeviceIntentExecutorLWMViewModel";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    track: jest.fn(),
  };
});

const mockedTrack = jest.mocked(track);

const layerABaseProperties = {
  deviceUxV2: true,
};

type Props = DeviceIntentExecutorProps<unknown, unknown, unknown, InitializationInput> & {
  initializerConfig?: InitializerConfig;
  sourceFlow: "swap";
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
    cancellableUI: true,
    onUserCancel: jest.fn(),
    cancelIntentRequestId: undefined,
    sourceFlow: "swap",
    ...overrides,
  };
}

function renderViewModel(initialProps?: Partial<Props>) {
  let props = makeProps(initialProps);
  const { result, rerender, unmount } = renderHook(() =>
    useDeviceIntentExecutorLWMViewModel(props),
  );
  const rerenderWithProps = (overrides: Partial<Props>) => {
    props = { ...props, ...overrides };
    rerender(undefined);
  };

  return { result, rerender, rerenderWithProps, unmount, props };
}

// Builds the minimum DeviceConnectionResult shape that the VM reads from.
// `useDeviceIntentExecutorLWMViewModel.mapConnectionResult` only uses
// `connectedDevice.modelId` (DMK id) and `connectedDevice.type`.
function makeConnectionResult(
  overrides: Partial<DeviceConnectionResult["connectedDevice"]> = {},
): DeviceConnectionResult {
  return {
    connectedDevice: {
      modelId: DMKDeviceModelId.STAX,
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

describe("useDeviceIntentExecutorLWMViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    currentRouteNameRef.current = "Connect Device - Connecting";
  });

  describe("GIVEN the ViewModel mounts", () => {
    it("WHEN the hook renders again THEN it fires deviceflow_started exactly once with the sourceFlow", () => {
      // WHEN
      const { rerender } = renderViewModel();
      rerender(undefined);

      // THEN
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
      // WHEN
      renderViewModel({ enabled: false });

      // THEN
      expect(mockedTrack).not.toHaveBeenCalledWith("deviceflow_started", expect.anything());
    });
  });

  describe("GIVEN a disabled ViewModel", () => {
    it("WHEN the executor is enabled THEN it fires deviceflow_started", () => {
      // GIVEN
      const { rerenderWithProps } = renderViewModel({ enabled: false });
      mockedTrack.mockClear();

      // WHEN
      rerenderWithProps({ enabled: true });

      // THEN
      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_started", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
    });
  });

  describe("GIVEN the executor reaches executingIntent for the first time", () => {
    it("WHEN the connection result is BLE THEN it fires app_ready THEN deviceflow_completed with the data carried by the state", () => {
      // GIVEN
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      // WHEN
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(
          executingIntentState(
            makeConnectionResult({ modelId: DMKDeviceModelId.STAX, type: "BLE" }),
          ),
        );
      });

      // THEN
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
      // GIVEN
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      // WHEN
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(
          executingIntentState(
            makeConnectionResult({ modelId: DMKDeviceModelId.NANO_X, type: "USB" }),
          ),
        );
      });

      // THEN
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
      // GIVEN
      const onExecutorStateChanged = jest.fn();
      const { result } = renderViewModel({ onExecutorStateChanged });
      const state = executingIntentState();

      // WHEN
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(state);
      });

      // THEN
      expect(onExecutorStateChanged).toHaveBeenCalledWith(state);
    });
  });

  describe("GIVEN the executor enters executingIntent a second time", () => {
    it("THEN it does not re-fire app_ready / deviceflow_completed", () => {
      // GIVEN
      const { result } = renderViewModel();
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });
      mockedTrack.mockClear();

      // WHEN
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });

      // THEN
      expect(mockedTrack).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a completed flow is disabled and reenabled", () => {
    it("WHEN the executor reaches executingIntent again THEN it tracks the new flow completion", () => {
      // GIVEN
      const { result, rerenderWithProps } = renderViewModel();
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });
      rerenderWithProps({ enabled: false });
      rerenderWithProps({ enabled: true });
      mockedTrack.mockClear();

      // WHEN
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });

      // THEN
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
      // GIVEN
      const onUserCancel = jest.fn();
      const { result, rerenderWithProps } = renderViewModel({ onUserCancel });
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });
      rerenderWithProps({ enabled: false });
      rerenderWithProps({ enabled: true });
      mockedTrack.mockClear();

      // WHEN
      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      // THEN
      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
      expect(onUserCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("GIVEN a non-completing executor state", () => {
    const nonCompleting: ExecutorState[] = [
      { type: "connectingDevice" },
      { type: "deviceDisconnected", device: makeConnectionResult().connectedDevice },
      { type: "initializingDeviceContext", connectionResult: makeConnectionResult() },
      { type: "idle" },
    ];

    it.each(nonCompleting)("WHEN state is $type THEN no additional Layer A event fires", state => {
      // GIVEN
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      // WHEN
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(state);
      });

      // THEN
      expect(mockedTrack).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a ViewModel that has not yet completed", () => {
    it("WHEN the user cancels THEN it tracks the Close button click", () => {
      // GIVEN
      const { result } = renderViewModel();
      mockedTrack.mockClear();

      // WHEN
      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      // THEN
      expect(mockedTrack).toHaveBeenNthCalledWith(1, "button_clicked", {
        ...layerABaseProperties,
        sourceFlow: "swap",
        button: "Close",
      });
    });

    it("WHEN the user cancels from a non-blocking page THEN it fires deviceflow_aborted and forwards to the original onUserCancel", () => {
      // GIVEN
      const onUserCancel = jest.fn();
      const { result } = renderViewModel({ onUserCancel });

      // WHEN
      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      // THEN
      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_aborted", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
      expect(onUserCancel).toHaveBeenCalledTimes(1);
    });

    it("WHEN the user cancels from a blocking page THEN it fires deviceflow_failed and forwards to the original onUserCancel", () => {
      // GIVEN
      currentRouteNameRef.current = PAGE_CONNECT_APP.UnsupportedFirmware;
      const onUserCancel = jest.fn();
      const { result } = renderViewModel({ onUserCancel });

      // WHEN
      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      // THEN
      expect(mockedTrack).toHaveBeenCalledWith("deviceflow_failed", {
        ...layerABaseProperties,
        sourceFlow: "swap",
      });
      expect(onUserCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("GIVEN a ViewModel that has already completed (executingIntent observed)", () => {
    it("WHEN the user cancels THEN it does NOT fire deviceflow_aborted but still forwards to the original onUserCancel", () => {
      // GIVEN
      const onUserCancel = jest.fn();
      const { result } = renderViewModel({ onUserCancel });
      act(() => {
        result.current.wrappedProps.onExecutorStateChanged(executingIntentState());
      });
      mockedTrack.mockClear();

      // WHEN
      act(() => {
        result.current.wrappedProps.onUserCancel();
      });

      // THEN
      expect(mockedTrack).not.toHaveBeenCalledWith("deviceflow_aborted", expect.anything());
      expect(onUserCancel).toHaveBeenCalledTimes(1);
    });
  });
});
