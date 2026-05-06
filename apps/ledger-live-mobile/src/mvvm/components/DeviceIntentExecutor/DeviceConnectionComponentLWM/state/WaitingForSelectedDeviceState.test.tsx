import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import * as Lumen from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import { WaitingForSelectedDeviceState } from "./WaitingForSelectedDeviceState";

jest.mock("~/helpers/getDeviceAnimation", () => ({
  getDeviceAnimation: jest.fn(() => ({ w: 1, h: 1 })),
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");

  return {
    ...actual,
    useTheme: jest.fn(() => ({ colorScheme: "light" })),
  };
});

type WaitingForSelectedDeviceUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
>;

const mockedGetDeviceAnimation = jest.mocked(getDeviceAnimation);
const mockedUseTheme = jest.mocked(Lumen.useTheme);
const animationSource = { w: 1, h: 1 } as ReturnType<typeof getDeviceAnimation>;

function makeKnownDevice(overrides: Partial<KnownDevice> = {}): KnownDevice {
  return {
    id: "device-id",
    name: "Ledger Nano X",
    deviceModelId: DeviceModelId.nanoX,
    transport: "ble" as KnownDevice["transport"],
    ...overrides,
  };
}

function renderState(device: KnownDevice) {
  const state: WaitingForSelectedDeviceUIState = {
    type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
    device,
  };

  return render(<WaitingForSelectedDeviceState state={state} />);
}

describe("WaitingForSelectedDeviceState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTheme.mockReturnValue({ colorScheme: "light" } as ReturnType<typeof Lumen.useTheme>);
    mockedGetDeviceAnimation.mockReturnValue(animationSource);
  });

  it("should render the selected device name and product-specific title", () => {
    renderState(makeKnownDevice({ name: "My Ledger" }));

    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(screen.getByText("Power on and unlock your Ledger Nano X")).toBeVisible();
  });

  it("should render the fallback device name when the selected device has no name", () => {
    renderState(makeKnownDevice({ name: null }));

    expect(screen.getByText("Ledger device")).toBeVisible();
  });

  it("should use the light animation theme when the current theme is not dark", () => {
    renderState(makeKnownDevice());

    expect(mockedGetDeviceAnimation).toHaveBeenCalledWith({
      theme: "light",
      modelId: DeviceModelId.nanoX,
      key: "plugAndPinCode",
    });
  });

  it("should use the dark animation theme when the current theme is dark", () => {
    mockedUseTheme.mockReturnValue({ colorScheme: "dark" } as ReturnType<typeof Lumen.useTheme>);

    renderState(makeKnownDevice());

    expect(mockedGetDeviceAnimation).toHaveBeenCalledWith({
      theme: "dark",
      modelId: DeviceModelId.nanoX,
      key: "plugAndPinCode",
    });
  });
});
