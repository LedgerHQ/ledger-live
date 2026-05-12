import { act, cleanup, render } from "@testing-library/react";
import React from "react";
import { Subject } from "rxjs";
import {
  DeviceManagementKit,
  DeviceSessionState,
  DeviceStatus,
} from "@ledgerhq/device-management-kit";
import { useDeviceSessionState } from "./useDeviceSessionState";
import { activeDeviceSessionRegistry } from "../config/activeDeviceSession";

const TestComponent: React.FC<{ dmk: DeviceManagementKit }> = ({ dmk }) => {
  const sessionState = useDeviceSessionState(dmk);
  return <div data-testid="device-status">{sessionState ? sessionState.deviceStatus : "null"}</div>;
};

describe("useDeviceSessionState", () => {
  let deviceManagementKitMock: DeviceManagementKit;
  let sessionStateSubject: Subject<DeviceSessionState>;

  beforeEach(() => {
    sessionStateSubject = new Subject<DeviceSessionState>();
    deviceManagementKitMock = {
      getDeviceSessionState: jest.fn(),
    } as unknown as DeviceManagementKit;

    jest
      .spyOn(deviceManagementKitMock, "getDeviceSessionState")
      .mockReturnValue(sessionStateSubject.asObservable());
  });

  afterEach(() => {
    cleanup();
    activeDeviceSessionRegistry.dispose();
    jest.clearAllMocks();
  });

  it("provides a default state when there is no active session", async () => {
    // when
    const result = await act(async () =>
      render(<TestComponent dmk={deviceManagementKitMock as unknown as DeviceManagementKit} />),
    );
    const { getByTestId } = result!;
    const statusElement = getByTestId("device-status");

    // then
    expect(statusElement).toHaveTextContent("null");
  });

  it("should display the device status when an active session is found", async () => {
    // given
    activeDeviceSessionRegistry.addSession({
      sessionId: "valid-session",
      dmk: deviceManagementKitMock,
    });
    // when
    const result = await act(async () =>
      render(<TestComponent dmk={deviceManagementKitMock as unknown as DeviceManagementKit} />),
    );
    const { getByTestId } = result;
    const statusElement = getByTestId("device-status");
    await act(async () => {
      sessionStateSubject.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
    });
    // then
    expect(statusElement).toHaveTextContent("CONNECTED");
  });

  it("should update the state when the device disconnects", async () => {
    // given
    activeDeviceSessionRegistry.addSession({
      sessionId: "valid-session",
      dmk: deviceManagementKitMock,
    });
    // when
    const result = await act(async () =>
      render(<TestComponent dmk={deviceManagementKitMock as unknown as DeviceManagementKit} />),
    );
    const { getByTestId } = result;
    const statusElement = getByTestId("device-status");
    await act(async () => {
      sessionStateSubject.next({ deviceStatus: DeviceStatus.CONNECTED } as DeviceSessionState);
    });
    // then
    expect(statusElement).toHaveTextContent("CONNECTED");
    // and when
    await act(async () => {
      sessionStateSubject.next({
        deviceStatus: DeviceStatus.NOT_CONNECTED,
      } as DeviceSessionState);
    });
    // then
    expect(statusElement).toHaveTextContent("null");
  });
});
