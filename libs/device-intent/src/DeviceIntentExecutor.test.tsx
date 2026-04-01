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
  defaultRequiredContext,
  flushMicrotasks,
  makeConnectionResult as makeBaseConnectionResult,
  makeIntent as makeBaseIntent,
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
  onError: (e: unknown) => void;
}> = ({ onConnected, onError }) => (
  <div>
    <button data-testid="connection" onClick={() => onConnected(makeConnectionResult())}>
      Connect
    </button>
    <button data-testid="connection-fail" onClick={() => onError(new Error("connection failed"))}>
      Fail
    </button>
  </div>
);

const InitializerComponent: React.FC<{
  onContextInitialized: (ctx: DeviceExtractedContext) => void;
}> = ({ onContextInitialized }) => (
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
);

const ConnectionErrorComponent: React.FC<{ error: unknown; onRetry: () => void }> = ({
  onRetry,
}) => (
  <button data-testid="connection-error" onClick={onRetry}>
    Retry Connection
  </button>
);

const InitErrorComponent: React.FC<{ error: unknown; onRetry: () => void }> = ({ onRetry }) => (
  <button data-testid="init-error" onClick={onRetry}>
    Retry Init
  </button>
);

const IntentErrorComponent: React.FC<{ error: unknown; onRetry: () => void }> = ({ onRetry }) => (
  <button data-testid="intent-error" onClick={onRetry}>
    Retry Intent
  </button>
);

const platformConfig: ExecutorPlatformConfiguration = {
  DeviceConnectionComponent: ConnectionComponent,
  DeviceContextInitializerComponent: InitializerComponent,
  ConnectionErrorComponent,
  InitializationErrorComponent: InitErrorComponent,
  IntentErrorComponent,
};

type TestProps = DeviceIntentExecutorProps<unknown, unknown, unknown> & {
  platformConfig: ExecutorPlatformConfiguration;
};

function makeProps(overrides: Partial<TestProps> = {}): TestProps {
  return {
    deviceConnectionParams: { acceptedDeviceModelIds: [] },
    requiredDeviceContext: defaultRequiredContext,
    onExecutorStateChanged: jest.fn(),
    intent: makeIntent(),
    intentComponentExtraProps: undefined,
    onIntentJobStateChanged: jest.fn(),
    onIntentJobComplete: jest.fn(),
    onIntentJobError: jest.fn(),
    enabled: true,
    cancellableUI: false,
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

  it("renders ConnectionErrorComponent when connection fails", () => {
    const props = makeProps();
    render(<DeviceIntentExecutor {...props} />);

    act(() => {
      screen.getByTestId("connection-fail").click();
    });

    expect(screen.getByTestId("connection-error")).toBeTruthy();
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

type UnitTestProps = DeviceIntentExecutorProps<unknown, unknown, unknown> & {
  platformConfig: ExecutorPlatformConfiguration;
  useExecutorHook: jest.Mock;
};

function makeMockPlatformConfig() {
  return {
    DeviceConnectionComponent: jest.fn(() => <div data-testid="connection" />),
    DeviceContextInitializerComponent: jest.fn(() => <div data-testid="initializer" />),
    ConnectionErrorComponent: jest.fn(() => <div data-testid="connection-error" />),
    InitializationErrorComponent: jest.fn(() => <div data-testid="init-error" />),
    IntentErrorComponent: jest.fn(() => <div data-testid="intent-error" />),
  };
}

function makeUnitProps(
  hookReturn: DeviceIntentExecutorHookState<unknown, unknown, unknown> | null,
  overrides: Partial<UnitTestProps> = {},
): UnitTestProps {
  return {
    deviceConnectionParams: { acceptedDeviceModelIds: [] },
    requiredDeviceContext: defaultRequiredContext,
    onExecutorStateChanged: jest.fn(),
    intent: makeIntent(),
    intentComponentExtraProps: undefined,
    onIntentJobStateChanged: jest.fn(),
    onIntentJobComplete: jest.fn(),
    onIntentJobError: jest.fn(),
    enabled: true,
    cancellableUI: false,
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
    const deviceConnectionParams = { acceptedDeviceModelIds: [] };
    render(
      <DeviceIntentExecutor
        deviceConnectionParams={deviceConnectionParams}
        requiredDeviceContext={defaultRequiredContext}
        onExecutorStateChanged={onExecutorStateChanged}
        intent={intent}
        intentComponentExtraProps={{ extra: 1 }}
        onIntentJobStateChanged={onIntentJobStateChanged}
        onIntentJobComplete={onIntentJobComplete}
        onIntentJobError={onIntentJobError}
        enabled={true}
        cancellableUI={false}
        cancelIntentRequestId={undefined}
        platformConfig={platformConfig}
        useExecutorHook={mockHook}
      />,
    );

    expect(mockHook).toHaveBeenCalledTimes(1);
    expect(mockHook).toHaveBeenCalledWith({
      deviceConnectionParams,
      requiredDeviceContext: defaultRequiredContext,
      onExecutorStateChanged,
      intent,
      intentComponentExtraProps: { extra: 1 },
      onIntentJobStateChanged,
      onIntentJobComplete,
      onIntentJobError,
      enabled: true,
      cancellableUI: false,
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
      const onError = jest.fn();
      const deviceConnectionParams = { acceptedDeviceModelIds: [] };
      const props = makeUnitProps(
        {
          phase: "deviceConnection",
          deviceConnectionParams,
          onConnected,
          onError,
        },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("connection")).toBeTruthy();
      expect(mockConfig.DeviceConnectionComponent).toHaveBeenCalledWith(
        { deviceConnectionParams, onConnected, onError },
        undefined,
      );
    });
  });

  describe("connectionError phase", () => {
    it("renders ConnectionErrorComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const error = new Error("fail");
      const onRetry = jest.fn();
      const props = makeUnitProps(
        { phase: "connectionError", error, onRetry },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("connection-error")).toBeTruthy();
      expect(mockConfig.ConnectionErrorComponent).toHaveBeenCalledWith(
        { error, onRetry },
        undefined,
      );
    });
  });

  describe("deviceInitialization phase", () => {
    it("renders DeviceContextInitializerComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const connectionResult = makeConnectionResult();
      const onContextInitialized = jest.fn();
      const onError = jest.fn();
      const props = makeUnitProps(
        {
          phase: "deviceInitialization",
          connectionResult,
          requiredDeviceContext: defaultRequiredContext,
          onContextInitialized,
          onError,
        },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("initializer")).toBeTruthy();
      expect(mockConfig.DeviceContextInitializerComponent).toHaveBeenCalledWith(
        {
          connectionResult,
          requiredDeviceContext: defaultRequiredContext,
          onContextInitialized,
          onError,
        },
        undefined,
      );
    });
  });

  describe("initializationError phase", () => {
    it("renders InitializationErrorComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const error = new Error("init fail");
      const onRetry = jest.fn();
      const props = makeUnitProps(
        { phase: "initializationError", error, onRetry },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("init-error")).toBeTruthy();
      expect(mockConfig.InitializationErrorComponent).toHaveBeenCalledWith(
        { error, onRetry },
        undefined,
      );
    });
  });

  describe("intentExecution phase", () => {
    it("renders the intent component with jobState and extraProps", () => {
      const IntentComp = jest.fn(({ jobState }: { jobState: unknown }) => (
        <div data-testid="intent-component">{String(jobState)}</div>
      ));
      const extraProps = { custom: "data" };
      const props = makeUnitProps({
        phase: "intentExecution",
        intentComponent: IntentComp,
        jobState: "running",
        intentComponentExtraProps: extraProps,
      });
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("intent-component")).toBeTruthy();
      expect(screen.getByTestId("intent-component").textContent).toBe("running");
      expect(IntentComp).toHaveBeenCalledWith({ jobState: "running", extraProps }, undefined);
    });
  });

  describe("intentError phase", () => {
    it("renders IntentErrorComponent with the correct props", () => {
      const mockConfig = makeMockPlatformConfig();
      const error = new Error("job fail");
      const onRetry = jest.fn();
      const props = makeUnitProps(
        { phase: "intentError", error, onRetry },
        { platformConfig: mockConfig },
      );
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("intent-error")).toBeTruthy();
      expect(mockConfig.IntentErrorComponent).toHaveBeenCalledWith({ error, onRetry }, undefined);
    });
  });

  describe("idle phase", () => {
    it("renders the last intent snapshot component with snapshot jobState and extraProps", () => {
      const IntentComp = jest.fn(({ jobState }: { jobState: unknown }) => (
        <div data-testid="intent-component">{String(jobState)}</div>
      ));
      const extraProps = { x: 42 };
      const props = makeUnitProps({
        phase: "idle",
        lastIntentSnapshot: {
          intentComponent: IntentComp,
          jobState: "final",
          intentComponentExtraProps: extraProps,
        },
      });
      render(<DeviceIntentExecutor {...props} />);

      expect(screen.getByTestId("intent-component")).toBeTruthy();
      expect(screen.getByTestId("intent-component").textContent).toBe("final");
      expect(IntentComp).toHaveBeenCalledWith({ jobState: "final", extraProps }, undefined);
    });

    it("renders nothing when lastIntentSnapshot is null", () => {
      const props = makeUnitProps({
        phase: "idle",
        lastIntentSnapshot: null,
      });
      const { container } = render(<DeviceIntentExecutor {...props} />);
      expect(container.innerHTML).toBe("");
    });
  });
});
