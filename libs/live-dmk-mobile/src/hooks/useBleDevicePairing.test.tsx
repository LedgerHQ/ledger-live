import { useBleDevicePairing } from "./useBleDevicePairing";
import * as dmkUtils from "./useDeviceManagementKit";
import React from "react";
import { Device } from "@ledgerhq/types-devices";
import { act, render } from "@testing-library/react";
import { Observable } from "rxjs";

const TestComponent: React.FC<{ device: Device }> = ({ device }) => {
  const { isPaired, pairingError } = useBleDevicePairing({ device });
  return (
    <div>
      <span data-testid="is-paired">{String(isPaired)}</span>
      <span data-testid="pairing-error">{String(pairingError)}</span>
    </div>
  );
};

const dmk = dmkUtils.getDeviceManagementKit();

describe("useBleDevicePairing", () => {
  beforeEach(() => {
    vi.spyOn(dmkUtils, "useDeviceManagementKit").mockReturnValue(dmk);
    vi.spyOn(dmk, "getDeviceSessionState").mockReturnValue(new Observable());
  });
  it("should pair a device", async () => {
    // given
    let result: ReturnType<typeof render> | undefined;
    vi.spyOn(dmk, "connect").mockResolvedValue("session");
    const device = { deviceId: "id", deviceName: "name", modelId: "model" };

    // when
    await act(async () => {
      result = render(<TestComponent device={device} />);
    });
    if (!result) {
      throw new Error("Result is undefined");
    }
    const { getByTestId } = result!;
    const isPaired = getByTestId("is-paired");
    const pairingError = getByTestId("pairing-error");

    // then
    expect(isPaired).toHaveTextContent("true");
    expect(pairingError).toHaveTextContent("null");
  });
  it("should set an error", async () => {
    // given
    let result: ReturnType<typeof render> | undefined;
    vi.spyOn(dmk, "connect").mockRejectedValue(new Error("connect error"));
    const device = { deviceId: "id", deviceName: "name", modelId: "model" };

    // when
    await act(async () => {
      result = render(<TestComponent device={device} />);
    });
    if (!result) {
      throw new Error("Result is undefined");
    }
    const { getByTestId } = result!;
    const isPaired = getByTestId("is-paired");
    const pairingError = getByTestId("pairing-error");

    // then
    expect(isPaired).toHaveTextContent("false");
    expect(pairingError).toHaveTextContent("Error: connect error");
  });
});
