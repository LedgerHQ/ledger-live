import React from "react";
import { render } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

const mockSelectDevice = jest.fn();
const mockGoToFollowInstructions = jest.fn();

jest.mock("~/hooks/deviceActions", () => ({
  useAppDeviceAction: () => jest.fn(),
  useSelectDevice: () => ({
    device: null,
    selectDevice: mockSelectDevice,
    registerDeviceSelection: jest.fn(),
  }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
  useNavigation: () => ({
    setOptions: jest.fn(),
  }),
}));

jest.mock("~/components/SelectDevice2", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View testID="select-device-2" />,
  };
});

let capturedOnResult: ((payload: { device: Device }) => void) | undefined;
let capturedOnClose: (() => void) | undefined;

jest.mock("~/components/DeviceActionModal", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: { onResult: (payload: { device: Device }) => void; onClose: () => void }) => {
      capturedOnResult = props.onResult;
      capturedOnClose = props.onClose;
      return <View testID="device-action-modal" />;
    },
  };
});

import DeviceSelection from "../screens/DeviceSelection";

const MOCK_DEVICE = {
  deviceId: "test-device-id",
  deviceName: "Test Device",
  modelId: DeviceModelId.stax,
  wired: false,
} as Device;

const defaultProps = {
  goToFollowInstructions: mockGoToFollowInstructions,
  route: { params: {} } as never,
  navigation: { setOptions: jest.fn() } as never,
};

describe("DeviceSelection onResult cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedOnResult = undefined;
    capturedOnClose = undefined;
  });

  it("should clear device state before navigating on result", () => {
    render(<DeviceSelection {...defaultProps} />);

    expect(capturedOnResult).toBeDefined();
    capturedOnResult!({ device: MOCK_DEVICE });

    expect(mockSelectDevice).toHaveBeenCalledWith(null);
    expect(mockGoToFollowInstructions).toHaveBeenCalledWith(MOCK_DEVICE);

    const selectDeviceCallOrder = mockSelectDevice.mock.invocationCallOrder[0];
    const goToFollowCallOrder = mockGoToFollowInstructions.mock.invocationCallOrder[0];
    expect(selectDeviceCallOrder).toBeLessThan(goToFollowCallOrder);
  });

  it("should clear device state on modal close", () => {
    render(<DeviceSelection {...defaultProps} />);

    expect(capturedOnClose).toBeDefined();
    capturedOnClose!();

    expect(mockSelectDevice).toHaveBeenCalledWith(null);
  });
});
