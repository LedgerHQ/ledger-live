import React from "react";
import { render, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BehaviorSubject, of } from "rxjs";
import {
  DeviceManagementKitProvider,
  useDeviceSessionState,
  useDeviceManagementKit,
} from "./index";
import { DeviceStatus } from "@ledgerhq/device-management-kit";

jest.mock("@ledgerhq/device-management-kit", () => ({
  DeviceManagementKitBuilder: jest.fn(() => ({
    addLogger: jest.fn().mockReturnThis(),
    addTransport: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({
      getDeviceSessionState: jest.fn(),
      startDiscovering: jest.fn(),
      connect: jest.fn(),
    }),
  })),
  BuiltinTransports: {
    USB: "USB",
  },
  ConsoleLogger: jest.fn(),
  LogLevel: { Debug: "debug" },
  DeviceStatus: {
    NOT_CONNECTED: "not_connected",
    CONNECTED: "connected",
  },
}));

const activeDeviceSessionSubjectMock = new BehaviorSubject<{
  sessionId: string;
  transport: { sessionId: string };
} | null>(null);

jest.mock("./index", () => ({
  ...jest.requireActual("./index"),
  useDeviceManagementKit: jest.fn(),
}));

afterEach(cleanup);

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
    getDeviceSessionState: jest.Mock;
  };

  beforeEach(() => {
    deviceManagementKitMock = {
      getDeviceSessionState: jest.fn(),
    };
    (useDeviceManagementKit as jest.Mock).mockReturnValue(deviceManagementKitMock);

    jest
      .spyOn(deviceManagementKitMock, "getDeviceSessionState")
      .mockImplementation(({ sessionId }: { sessionId: string }) => {
        if (sessionId === "valid-session") {
          return of({
            deviceStatus: DeviceStatus.CONNECTED,
          });
        } else {
          return of({
            deviceStatus: DeviceStatus.NOT_CONNECTED,
          });
        }
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display the device status when an active session is found", async () => {
    activeDeviceSessionSubjectMock.next({
      sessionId: "valid-session",
      transport: {
        sessionId: "",
      },
    });

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

    const { getByTestId } = result!;

    const statusElement = getByTestId("device-status");
    expect(statusElement).toHaveTextContent("connected");
  });

  it("should update the state when the device disconnects", async () => {
    activeDeviceSessionSubjectMock.next({
      sessionId: "valid-session",
      transport: {
        sessionId: "",
      },
    });

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

    activeDeviceSessionSubjectMock.next(null);

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
