import { act, render } from "@testing-library/react";
import React from "react";
import { of } from "rxjs";
import {
  DeviceManagementKit,
  DeviceSessionState,
  DeviceStatus,
} from "@ledgerhq/device-management-kit";
import { useDeviceSessionState } from "./useDeviceSessionState";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";

const TestComponent: React.FC<{ dmk: DeviceManagementKit }> = ({ dmk }) => {
  const sessionState = useDeviceSessionState(dmk);
  return <div data-testid="device-status">{sessionState ? sessionState.deviceStatus : "null"}</div>;
};

describe("useDeviceSessionState", () => {
  let deviceManagementKitMock: DeviceManagementKit;

  beforeEach(() => {
    deviceManagementKitMock = {
      getDeviceSessionState: vi.fn(),
    } as unknown as DeviceManagementKit;

    vi.spyOn(deviceManagementKitMock, "getDeviceSessionState").mockImplementation(({ sessionId }) =>
      of({
        deviceStatus:
          sessionId === "valid-session" ? DeviceStatus.CONNECTED : DeviceStatus.NOT_CONNECTED,
      } as DeviceSessionState),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("provides a default state when there is no active session", async () => {
    // given
    activeDeviceSessionSubject.next(null);

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
    activeDeviceSessionSubject.next({ sessionId: "valid-session", transport: {} as any });
    // when
    const result = await act(async () =>
      render(<TestComponent dmk={deviceManagementKitMock as unknown as DeviceManagementKit} />),
    );
    const { getByTestId } = result;
    const statusElement = getByTestId("device-status");
    // then
    expect(statusElement).toHaveTextContent("CONNECTED");
  });

  it("should update the state when the device disconnects", async () => {
    // given
    activeDeviceSessionSubject.next({ sessionId: "valid-session", transport: {} as any });
    // when
    const result = await act(async () =>
      render(<TestComponent dmk={deviceManagementKitMock as unknown as DeviceManagementKit} />),
    );
    const { getByTestId } = result;
    const statusElement = getByTestId("device-status");
    // then
    expect(statusElement).toHaveTextContent("CONNECTED");
    // and when
    await act(async () => {
      activeDeviceSessionSubject.next(null);
    });
    // then
    expect(statusElement).toHaveTextContent("null");
  });
});
