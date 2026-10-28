import React from "react";
import { act, screen } from "@testing-library/react";
import type { BluetoothPairingRequest } from "~/bridge/contract";
import { bluetooth } from "~/renderer/bridge";
import { render } from "tests/testSetup";
import { BluetoothPairingDialog } from "./BluetoothPairingDialog";
import { BLUETOOTH_PAIRING_TIMEOUT_MS } from "~/bridge/contract";

const mockedBluetooth = jest.mocked(bluetooth);

let emitPairingRequest: (request: BluetoothPairingRequest) => void;

const confirmPinRequest: BluetoothPairingRequest = {
  requestId: 1,
  deviceId: "device-id",
  pairingKind: "confirmPin",
  pin: "123456",
};

const providePinRequest: BluetoothPairingRequest = {
  requestId: 2,
  deviceId: "device-id",
  pairingKind: "providePin",
};

describe("BluetoothPairingDialog", () => {
  beforeEach(() => {
    mockedBluetooth.onPairingRequest.mockImplementation(callback => {
      emitPairingRequest = callback;
      return () => undefined;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("GIVEN a confirmPin request WHEN the codes match THEN it confirms the pairing", async () => {
    const { user } = render(<BluetoothPairingDialog />);
    act(() => emitPairingRequest(confirmPinRequest));

    expect(screen.getByText("123456")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Codes match" }));

    expect(mockedBluetooth.respondToPairing).toHaveBeenCalledWith(1, { confirmed: true });
  });

  it("GIVEN a confirmPin request WHEN the codes differ THEN it refuses the pairing", async () => {
    const { user } = render(<BluetoothPairingDialog />);
    act(() => emitPairingRequest(confirmPinRequest));

    await user.click(screen.getByRole("button", { name: "Codes don't match" }));

    expect(mockedBluetooth.respondToPairing).toHaveBeenCalledWith(1, { confirmed: false });
  });

  it("GIVEN a providePin request WHEN the code is incomplete THEN pairing cannot be submitted", async () => {
    const { user } = render(<BluetoothPairingDialog />);
    act(() => emitPairingRequest(providePinRequest));

    await user.type(screen.getByLabelText("Pairing code"), "12a4");

    expect(screen.getByRole("button", { name: "Pair" })).toBeDisabled();
    expect(mockedBluetooth.respondToPairing).not.toHaveBeenCalled();
  });

  it("GIVEN a providePin request WHEN the user types the 6-digit code THEN it sends it", async () => {
    const { user } = render(<BluetoothPairingDialog />);
    act(() => emitPairingRequest(providePinRequest));

    await user.type(screen.getByLabelText("Pairing code"), "654321");
    await user.click(screen.getByRole("button", { name: "Pair" }));

    expect(mockedBluetooth.respondToPairing).toHaveBeenCalledWith(2, {
      confirmed: true,
      pin: "654321",
    });
  });

  it("GIVEN an unanswered request WHEN the main process timeout is over THEN the dialog closes", () => {
    jest.useFakeTimers();
    render(<BluetoothPairingDialog />);
    act(() => emitPairingRequest(confirmPinRequest));
    expect(screen.getByText("123456")).toBeVisible();

    act(() => jest.advanceTimersByTime(BLUETOOTH_PAIRING_TIMEOUT_MS));

    expect(screen.queryByText("123456")).toBeNull();
    expect(mockedBluetooth.respondToPairing).not.toHaveBeenCalled();
  });
});
