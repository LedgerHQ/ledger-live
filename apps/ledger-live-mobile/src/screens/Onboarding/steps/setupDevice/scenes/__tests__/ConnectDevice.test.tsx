import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, waitFor } from "@tests/test-renderer";
import ConnectDevice from "../ConnectDevice";

jest.mock("~/hooks/deviceActions", () => ({
  useManagerDeviceAction: () => ({}),
}));

jest.mock("~/components/SelectDevice2", () => {
  const { Pressable, Text } = jest.requireActual("react-native");

  return function SelectDevice2Mock({
    onSelect,
  }: {
    onSelect: (device: {
      deviceId: string;
      deviceName: string;
      modelId: DeviceModelId;
      wired: boolean;
    }) => void;
  }) {
    return (
      <Pressable
        accessibilityLabel="Select device"
        onPress={() =>
          onSelect({
            deviceId: "device-id",
            deviceName: "Ledger Stax",
            modelId: DeviceModelId.stax,
            wired: false,
          })
        }
      >
        <Text>Select device</Text>
      </Pressable>
    );
  };
});

jest.mock("~/components/DeviceAction", () => {
  const { Pressable, Text } = jest.requireActual("react-native");

  return function DeviceActionMock({
    onResult,
  }: {
    onResult?: (payload: { result: { installed: string[] } }) => void;
  }) {
    return (
      <Pressable
        accessibilityLabel="Complete pairing"
        onPress={() => onResult?.({ result: { installed: [] } })}
      >
        <Text>Complete pairing</Text>
      </Pressable>
    );
  };
});

describe("ConnectDevice", () => {
  it("should open the device modal again after a completed pairing session", async () => {
    const onSuccess = jest.fn();
    const { user } = render(<ConnectDevice onSuccess={onSuccess} />);

    expect(screen.queryByLabelText("Complete pairing")).toBeNull();

    await user.press(screen.getByLabelText("Select device"));
    expect(screen.getByLabelText("Complete pairing")).toBeVisible();

    await user.press(screen.getByLabelText("Complete pairing"));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(screen.queryByLabelText("Complete pairing")).toBeNull();

    await user.press(screen.getByLabelText("Select device"));
    expect(screen.getByLabelText("Complete pairing")).toBeVisible();
  });
});
