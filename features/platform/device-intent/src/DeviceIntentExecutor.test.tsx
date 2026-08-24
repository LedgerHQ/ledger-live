/**
 * @jest-environment jsdom
 */

/**
 * Tests for DeviceIntentExecutor — the React component that maps hook state
 * to the correct platform-provided UI component for each phase.
 *
 * ## Test strategy
 *
 * **Integration tests (real hook + real StateMachine)**
 * Render the component with real platform stub components and drive the flow
 * through user interactions (button clicks). These are smoke tests that
 * verify the real wiring works end-to-end — not every phase is exercised
 * here since per-phase rendering is covered exhaustively by the unit tests:
 *   - Initial render shows the connection component
 *   - Connection error → error component
 *   - Full happy path: connection → initialization → intent execution → idle
 *   - enabled=false → renders nothing
 *
 * **Unit tests (mocked hook)**
 * Inject a mock useExecutorHook to return a specific phase state, verifying
 * the component's rendering logic in isolation:
 *   - Hook is called with the correct props (platformConfig and useExecutorHook excluded)
 *   - Each phase renders the correct platform component with the right props
 *   - Null hook return → renders nothing
 *   - Idle phase with/without lastIntentSnapshot
 */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import { NEVER, of } from "rxjs";
import type { DeviceConnectionResult, DeviceExtractedContext } from "./core";
import type { DeviceIntentExecutorProps, ExecutorPlatformConfiguration } from "./executor";
import type { DeviceIntentExecutorHookState } from "./useDeviceIntentExecutor";
import { DeviceIntentExecutor } from "./DeviceIntentExecutor";
import {
  defaultDeviceInitializationInput,
  flushMicrotasks,
  makeConnectionResult as makeBaseConnectionResult,
  makeIntent as makeBaseIntent,
  type MockDeviceInitializationInput,
} from "./__tests__/test-utils";

// ---- Mocks ----

jest.mock("@ledgerhq/device-management-kit", () => ({
  DeviceStatus: { NOT_CONNECTED: "not-connected" },
}));

// ---- Test helpers ----

const intentComponent = ({ jobState }: { jobState: unknown }) => (
  <div data-testid="intent-component">{String(jobState)}</div>
);

const makeIntent = (job: () => import("rxjs").Observable<unknown> = () => NEVER) =>
  makeBaseIntent({ job, component: intentComponent });

const makeConnectionResult = (): DeviceConnectionResult => ({
  ...makeBaseConnectionResult(),
  dmk: {
    getDeviceSessionState: jest.fn(() => NEVER),
  } as unknown as DeviceConnectionResult["dmk"],
});

const ConnectionComponent: React.FC<{
  onConnected: (r: DeviceConnectionResult) => void;
  onClose: () => void;
}> = ({ onConnected, onClose }) => (
  <div>
    <button data-testid="connection" onClick={() => onConnected(makeConnectionResult())}>
      Connect
    </button>
    <button data-testid="connection-close" onClick={onClose}>
      Close
    </button>
  </div>
);

const AutoConnectingComponent: React.FC<{
  onConnected: (r: DeviceConnectionResult) => void;
}> = ({ onConnected }) => {
  React.useEffect(() => {
    onConnected(makeConnectionResult());
  }, [onConnected]);

  return <div data-testid="auto-connection" />;
};

const InitializerComponent: React.FC<{
  onContextInitialized: (ctx: DeviceExtractedContext) => void;
  onClose: () => void;
}> = ({ onContextInitialized, onClose }) => (
  <div>
    <button
      data-testid="initializer"
      onClick={() =>
        onContextInitialized({
          currentOsVersion: "2.0.0",
          osUpdateAvailable: false,
          currentAppName: "Ethereum",
          currentAppVersion: "1.10.0",
        })
      }
    >
      Initialize
    </button>
    <button data-testid="initializer-close" onClick={onClose}>
      Close
    </button>
  </div>
);

const DeviceDisconnectedComponent: React.FC<{
  device: DeviceConnectionResult["connectedDevice"];
  onRetry: () => void;
  onClose: () => void;
}> = ({ onRetry, onClose }) => (
  <div>
    <button data-testid="device-disconnected" onClick={onRetry}>
      Retry Connection
    </button>
    <button data-testid="device-disconnected-close" onClick={onClose}>
      Close
    </button>
  </div>
);

const IntentErrorComponent: React.FC<{
  error: unknown;
  device: DeviceConnectionResult["connectedDevice"];
  onRetry: () => void;
  onClose: () => void;
}> = ({ onRetry, onClose }) => (
  <div>
    <button data-testid="intent-error" onClick={onRetry}>
      Retry Intent
    </button>
    <button data-testid="intent-error-close" onClick={onClose}>
      Close
    </button>
  </div>
);

const InvalidOperationComponent: React.FC<{ error: unknown; onClose: () => void }> = ({
  onClose,
}) => (
  <button data-testid="invalid-operation" onClick={onClose}>
    Close Executor
  </button>
);

const platformConfig: ExecutorPlatformConfiguration<MockDeviceInitializationInput> = {
  DeviceConnectionComponent: ConnectionComponent,
  DeviceContextInitializerComponent: InitializerComponent,
  DeviceDisconnectedComponent,
  IntentErrorComponent,
  InvalidOperationComponent,
};

type TestProps = DeviceIntentExecutorProps<
  unknown,
  unknown,
  unknown,
  MockDeviceInitializationInput
> & {
  platformConfig: ExecutorPlatformConfiguration<MockDeviceInitializationInput>;
};

function makeProps(overrides: Partial<TestProps> = {}): TestProps {
  return {
    deviceConnectionParams: { acceptedDeviceModelIds: [] },
    deviceInitializationInput: defaultDeviceInitializationInput,
    onExecutorStateChanged: jest.fn(),
    intent: makeIntent(),
    intentComponentExtraProps: undefined,
    onIntentJobStateChanged: jest.fn(),
    onIntentJobComplete: jest.fn(),
    onIntentJobError: jest.fn(),
    enabled: true,
    onUserCancel: jest.fn(),
    cancelIntentRequestId: undefined,
    platformConfig,
    ...overrides,
  };
}

// ---- Tests ----

describe("DeviceIntentExecutor (integration)", () => {
  it("renders the DeviceConnectionComponent on mount", () => {
    const props = makeProps();
    render(<DeviceIntentExecutor {...props} />);
    expect(screen.getByTestId("connection")).toBeTruthy();
  });

  it("GIVEN the connection component connects from its mount effect WHEN rendering THEN it reaches device initialization", async () => {
    // GIVEN
    const props = makeProps({
      platformConfig: {
        ...platformConfig,
        DeviceConnectionComponent: AutoConnectingComponent,
      },
    });

    // WHEN
    render(<DeviceIntentExecutor {...props} />);

    // THEN
    expect(await screen.findByTestId("initializer")).toBeTruthy();
  });

  it("renders nothing when enabled is false", () => {
    const props = makeProps({ enabled: false });
    const { container } = render(<DeviceIntentExecutor {...props} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the last intent component during idle after a job completes", async () => {
    const props = makeProps({ intent: makeIntent(() => of("final-state")) });
    render(<DeviceIntentExecutor {...props} />);

    act(() => {
      screen.getByTestId("connection").click();
    });

    act(() => {
      screen.getByTestId("initializer").click();
    });

    await act(async () => {
      await flushMicrotasks();
    });

    expect(screen.getByTestId("intent-component")).toBeTruthy();
    expect(screen.getByTestId("intent-component").textContent).toBe("final-state");
  });
});

// ---- Unit tests (mocked hook) ----

type UnitTestProps = DeviceIntentExecutorProps<
  unknown,
  unknown,
  unknown,
  MockDeviceInitializationInput
> & {
  platformConfig: ExecutorPlatformConfiguration<MockDeviceInitializationInput>;
  useExecutorHook: jest.Mock;
};

function makeMockPlatformConfig() {
  return {
    DeviceConnectionComponent: jest.fn(() => <div data-testid="connection" />),
    DeviceContextInitializerComponent: jest.fn(() => <div data-testid="initializer" />),
    DeviceDisconnectedComponent: jest.fn(() => <div data-testid="device-disconnected" />),
    IntentErrorComponent: jest.fn(() => <div data-testid="intent-error" />),
    InvalidOperationComponent: jest.fn(() => <div data-testid="invalid-operation" />),
  } satisfies ExecutorPlatformConfiguration<MockDeviceInitializationInput>;
}

function makeUnitProps(
  hookReturn: DeviceIntentExecutorHookState<
    unknown,
    unknown,
    unknown,
    MockDeviceInitializationInput
  > | null,
  overrides: Partial<UnitTestProps> = {},
): UnitTestProps {
  return {
    deviceConnectionParams: { acceptedDeviceModelIds: [] },
    deviceInitializationInput: defaultDeviceInitializationInput,
    onExecutorStateChanged: jest.fn(),
    intent: makeIntent(),
    intentComponentExtraProps: undefined,
    onIntentJobStateChanged: jest.fn(),
    onIntentJobComplete: jest.fn(),
    onIntentJobError: jest.fn(),
    enabled: true,
    onUserCancel: jest.fn(),
    cancelIntentRequestId: undefined,
    platformConfig,
    useExecutorHook: jest.fn(() => hookReturn),
    ...overrides,
  };
}

describe("DeviceIntentExecutor (unit)", () => {
  it("calls the injected hook with the executor props (excluding platformConfig and useExecutorHook)", () => {
    const mockHook = jest.fn(() => null);
    const intent = makeIntent();
    const onExecutorStateChanged = jest.fn();
    const onIntentJobStateChanged = jest.fn();
    const onIntentJobComplete = jest.fn();
    const onIntentJobError = jest.fn();
    const onUserCancel = jest.fn();
    const deviceConnectionParams = { acceptedDeviceModelIds: [] };
    render(
      <DeviceIntentExecutor
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={defaultDeviceInitializationInput}
        onExecutorStateChanged={onExecutorStateChanged}
        intent={intent}
        intentComponentExtraProps={{ extra: 1 }}
        onIntentJobStateChanged={onIntentJobStateChanged}
        onIntentJobComplete={onIntentJobComplete}
        onIntentJobError={onIntentJobError}
        enabled={true}
        onUserCancel={onUserCancel}
        cancelIntentRequestId={undefined}
        platformConfig={platformConfig}
        useExecutorHook={mockHook}
      />,
    );

    expect(mockHook).toHaveBeenCalledTimes(1);
    expect(mockHook).toHaveBeenCalledWith({
      deviceConnectionParams,
      deviceInitializationInput: defaultDeviceInitializationInput,
      onExecutorStateChanged,
      intent,
      intentComponentExtraProps: { extra: 1 },
      onIntentJobStateChanged,
      onIntentJobComplete,
      onIntentJobError,
      enabled: true,
      onUserCancel,
      cancelIntentRequestId: undefined,
    });
  });

  it("renders nothing when the hook returns null", () => {
    const props = makeUnitProps(null);
    const { container } = render(<DeviceIntentExecutor {...props} />);
    expect(container.innerHTML).toBe("");
  });

  describe("deviceConnection phase", () => {
    it("renders DeviceConnectionComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const onConnected = jest.fn();
      const onClose = jest.fn();
      const deviceConnectionParams = { acceptedDeviceModelIds: [] };
      const props = makeUnitProps(
        {
          phase: "deviceConnection",
          deviceConnectionParams,
          onConnected,
          onClose,
        },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("connection")).toBeTruthy();
      expect(mockConfig.DeviceConnectionComponent).toHaveBeenCalledWith(
        { deviceConnectionParams, onConnected, onClose },
        undefined,
      );
    });
  });

  describe("deviceDisconnected phase", () => {
    it("renders DeviceDisconnectedComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const onRetry = jest.fn();
      const onClose = jest.fn();
      const device = makeConnectionResult().connectedDevice;
      const props = makeUnitProps(
        { phase: "deviceDisconnected", device, onRetry, onClose },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("device-disconnected")).toBeTruthy();
      expect(mockConfig.DeviceDisconnectedComponent).toHaveBeenCalledWith(
        { device, onRetry, onClose },
        undefined,
      );
    });
  });

  describe("deviceInitialization phase", () => {
    it("renders DeviceContextInitializerComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const connectionResult = makeConnectionResult();
      const onContextInitialized = jest.fn();
      const onClose = jest.fn();
      const props = makeUnitProps(
        {
          phase: "deviceInitialization",
          connectionResult,
          deviceInitializationInput: defaultDeviceInitializationInput,
          onContextInitialized,
          onClose,
        },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("initializer")).toBeTruthy();
      expect(mockConfig.DeviceContextInitializerComponent).toHaveBeenCalledWith(
        {
          connectionResult,
          deviceInitializationInput: defaultDeviceInitializationInput,
          onContextInitialized,
          onClose,
        },
        undefined,
      );
    });
  });

  describe("intentExecution phase", () => {
    it("renders the intent component with jobState, extraProps and onClose", () => {
      const IntentComp = jest.fn(({ jobState }: { jobState: unknown }) => (
        <div data-testid="intent-component">{String(jobState)}</div>
      ));
      const extraProps = { custom: "data" };
      const onClose = jest.fn();
      const props = makeUnitProps({
        phase: "intentExecution",
        intentComponent: IntentComp,
        jobState: "running",
        intentComponentExtraProps: extraProps,
        onClose,
      });
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("intent-component")).toBeTruthy();
      expect(screen.getByTestId("intent-component").textContent).toBe("running");
      expect(IntentComp).toHaveBeenCalledWith(
        { jobState: "running", extraProps, onClose },
        undefined,
      );
    });
  });

  describe("intentError phase", () => {
    it("renders IntentErrorComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const error = new Error("job fail");
      const onRetry = jest.fn();
      const onClose = jest.fn();
      const device = makeConnectionResult().connectedDevice;
      const props = makeUnitProps(
        { phase: "intentError", error, device, onRetry, onClose },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("intent-error")).toBeTruthy();
      expect(mockConfig.IntentErrorComponent).toHaveBeenCalledWith(
        { error, device, onRetry, onClose },
        undefined,
      );
    });
  });

  describe("invalidOperation phase", () => {
    it("renders InvalidOperationComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const error = new Error("invalid operation");
      const onClose = jest.fn();
      const props = makeUnitProps(
        { phase: "invalidOperation", error, onClose },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("invalid-operation")).toBeTruthy();
      expect(mockConfig.InvalidOperationComponent).toHaveBeenCalledWith(
        { error, onClose },
        undefined,
      );
    });
  });

  describe("idle phase", () => {
    it("renders the last intent snapshot component with snapshot jobState/extraProps and the current onClose", () => {
      const IntentComp = jest.fn(({ jobState }: { jobState: unknown }) => (
        <div data-testid="intent-component">{String(jobState)}</div>
      ));
      const extraProps = { x: 42 };
      const onClose = jest.fn();
      const props = makeUnitProps({
        phase: "idle",
        lastIntentSnapshot: {
          intentComponent: IntentComp,
          jobState: "final",
          intentComponentExtraProps: extraProps,
        },
        onClose,
      });
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("intent-component")).toBeTruthy();
      expect(screen.getByTestId("intent-component").textContent).toBe("final");
      expect(IntentComp).toHaveBeenCalledWith(
        { jobState: "final", extraProps, onClose },
        undefined,
      );
    });

    it("renders nothing when lastIntentSnapshot is null", () => {
      const props = makeUnitProps({
        phase: "idle",
        lastIntentSnapshot: null,
        onClose: jest.fn(),
      });
      const { container } = render(<DeviceIntentExecutor {...props} />);
      expect(container.innerHTML).toBe("");
    });
  });
});
