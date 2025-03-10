import { render, act } from "@testing-library/react";
import { type Mock } from "vitest";
import React from "react";
import { of } from "rxjs";
import { DeviceStatus } from "@ledgerhq/device-management-kit";
import { DeviceManagementKitProvider, useDeviceManagementKit } from "./useDeviceManagementKit";
import { useDeviceSessionState } from "./useDeviceSessionState";

vi.mock("@ledgerhq/device-management-kit", async importOriginal => {
  const actual = await importOriginal<typeof import("@ledgerhq/device-management-kit")>();
  return {
    ...actual,
    DeviceManagementKitBuilder: vi.fn(() => ({
      addLogger: vi.fn().mockReturnThis(),
      addTransport: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({
        getDeviceSessionState: vi.fn(),
        startDiscovering: vi.fn(),
        connect: vi.fn(),
      }),
    })),
    BuiltinTransports: {
      USB: "USB",
    },
    ConsoleLogger: vi.fn(),
    LogLevel: { Debug: "debug" },
    DeviceStatus: {
      NOT_CONNECTED: "not_connected",
      CONNECTED: "connected",
    },
  };
});

vi.mock("./useDeviceManagementKit", async importOriginal => {
  const actual = await importOriginal<typeof import("./useDeviceManagementKit")>();
  return {
    ...actual,
    useDeviceManagementKit: vi.fn(),
  };
});

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DeviceManagementKitProvider>{children}</DeviceManagementKitProvider>
);

const TestComponent: React.FC = () => {
  const sessionState = useDeviceSessionState();
  return (
    <div data-testid="device-status">
      {sessionState ? sessionState.deviceStatus : "No device connected"}
    </div>
  );
};

describe("useDeviceSessionState", () => {
  let deviceManagementKitMock: {
    getDeviceSessionState: Mock;
  };

  beforeEach(() => {
    deviceManagementKitMock = {
      getDeviceSessionState: vi.fn(),
    };
    (useDeviceManagementKit as Mock).mockReturnValue(deviceManagementKitMock);

    vi.spyOn(deviceManagementKitMock, "getDeviceSessionState").mockImplementation(
      ({ sessionId }: { sessionId: string }) => {
        if (sessionId === "valid-session") {
          return of({
            deviceStatus: DeviceStatus.CONNECTED,
          });
        }
      },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should display the device status when an active session is found", async () => {
    let result: ReturnType<typeof render> | undefined;
    await act(async () => {
      result = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );
    });

    if (!result) {
      throw new Error("Result is undefined");
    }

    const { getByTestId } = result!;

    const statusElement = getByTestId("device-status");
    expect(statusElement).toHaveTextContent("connected");
  });

  it("should update the state when the device disconnects", async () => {
    let result: ReturnType<typeof render> | undefined;
    await act(async () => {
      result = render(
        <Wrapper>
          <TestComponent />
        </Wrapper>,
      );
    });

    if (!result) {
      throw new Error("Failed to render component");
    }
    const { getByTestId } = result;

    const statusElement = getByTestId("device-status");
    expect(statusElement).toHaveTextContent("connected");

    await act(async () => {
      deviceManagementKitMock.getDeviceSessionState.mockReturnValueOnce(
        of({
          deviceStatus: DeviceStatus.NOT_CONNECTED,
        }),
      );
    });

    expect(statusElement).toHaveTextContent("No device connected");
  });
});
