import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  ConnectNewDeviceUIStateTypes,
  DeviceListItemStatuses,
  rnBleTransportIdentifier,
  rnHidTransportIdentifier,
  type ConnectKnownOrNewDeviceUIState,
  type DeviceListItem,
  type SelectableDeviceListItem,
} from "@ledgerhq/live-dmk-mobile";
import { ConnectKnownOrNewDeviceView } from "./ConnectKnownOrNewDeviceView";
import type { ConnectKnownOrNewDeviceViewProps } from "./types";

type ConnectedRow = Extract<
  SelectableDeviceListItem,
  { status: typeof DeviceListItemStatuses.Connected }
>;

const makeRow = (key: string, overrides: Partial<DeviceListItem> = {}): DeviceListItem => ({
  key,
  device: {
    id: `${key}-id`,
    name: key,
    deviceModelId: DeviceModelId.stax,
    transport: rnBleTransportIdentifier,
  },
  connectivity: "BLE",
  status: DeviceListItemStatuses.Unavailable,
  ...overrides,
});

const unavailableBleRow = (): SelectableDeviceListItem => ({
  ...makeRow("Flex 329", { status: DeviceListItemStatuses.Unavailable }),
  status: DeviceListItemStatuses.Unavailable,
  connect: jest.fn(),
  remove: jest.fn(),
});

const availableUsbRow = (): SelectableDeviceListItem => ({
  ...makeRow("Nano S Plus", {
    connectivity: "USB",
    device: {
      id: "usb-id",
      name: "Nano S Plus",
      deviceModelId: DeviceModelId.nanoSP,
      transport: rnHidTransportIdentifier,
    },
  }),
  status: DeviceListItemStatuses.Available,
  connect: jest.fn(),
});

const connectedBleRow = (): ConnectedRow => ({
  ...makeRow("Stax 2"),
  status: DeviceListItemStatuses.Connected,
  connect: jest.fn(),
  disconnect: jest.fn(),
  remove: jest.fn(),
});

const connectedUsbRow = (): ConnectedRow => ({
  ...makeRow("Nano X", { connectivity: "USB" }),
  status: DeviceListItemStatuses.Connected,
  connect: jest.fn(),
  disconnect: jest.fn(),
});

const fiveRows = (): Array<SelectableDeviceListItem> =>
  ["A", "B", "C", "D", "E"].map(name => ({
    ...makeRow(name),
    status: DeviceListItemStatuses.Unavailable,
    connect: jest.fn(),
  }));

const discovering = (
  devices: Array<SelectableDeviceListItem>,
  addNewDevice = jest.fn(),
): ConnectKnownOrNewDeviceUIState => ({
  type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
  devices,
  addNewDevice,
});

function renderView(state: ConnectKnownOrNewDeviceUIState, devices: Array<DeviceListItem> = []) {
  const props: ConnectKnownOrNewDeviceViewProps = {
    state,
    devices,
    addModeLastNonErrorState: {
      type: ConnectNewDeviceUIStateTypes.Discovering,
      devices: [],
      scanningTransports: [],
      showDeviceNotFound: false,
    },
    platform: "android",
    onCloseErrorSheet: jest.fn(),
    onCloseAddModeErrorSheet: jest.fn(),
  };
  return render(<ConnectKnownOrNewDeviceView {...props} />);
}

describe("ConnectKnownOrNewDeviceView", () => {
  describe("Rows", () => {
    it("should show the status of each device", () => {
      renderView(discovering([connectedBleRow(), availableUsbRow(), unavailableBleRow()]));

      expect(screen.getByText("Connected")).toBeVisible();
      expect(screen.getByText("Available")).toBeVisible();
      expect(screen.getByText("Not connected")).toBeVisible();
    });

    it("should connect a device when its row is pressed", async () => {
      const row = availableUsbRow();
      const { user } = renderView(discovering([row]));

      await user.press(screen.getByText("Nano S Plus"));

      expect(row.connect).toHaveBeenCalledTimes(1);
    });

    it("should show the Add link above the list", async () => {
      const addNewDevice = jest.fn();
      const { user } = renderView(discovering([unavailableBleRow()], addNewDevice));

      await user.press(screen.getByText("Add"));

      expect(addNewDevice).toHaveBeenCalledTimes(1);
    });

    it("should show no menu on the rows of a state without device actions", () => {
      renderView(
        {
          type: ConnectKnownOrNewDeviceUIStateTypes.Connecting,
          devices: [makeRow("Flex 329")],
          device: makeRow("Flex 329").device,
          close: jest.fn(),
        },
        [makeRow("Flex 329")],
      );

      expect(screen.queryByTestId("connect-known-or-new-device-menu-Flex 329")).toBeNull();
      expect(screen.queryByText("Add")).toBeNull();
    });
  });

  describe("Menu", () => {
    it("should disconnect a connected Bluetooth device from its menu", async () => {
      const row = connectedBleRow();
      const { user } = renderView(discovering([row]));

      await user.press(screen.getByTestId("connect-known-or-new-device-menu-Stax 2"));
      expect(screen.getByText("Remove")).toBeVisible();
      await user.press(screen.getByText("Disconnect"));

      expect(row.disconnect).toHaveBeenCalledTimes(1);
      expect(row.remove).not.toHaveBeenCalled();
    });

    it("should remove a connected Bluetooth device from its menu", async () => {
      const row = connectedBleRow();
      const { user } = renderView(discovering([row]));

      await user.press(screen.getByTestId("connect-known-or-new-device-menu-Stax 2"));
      await user.press(screen.getByText("Remove"));

      expect(row.remove).toHaveBeenCalledTimes(1);
    });

    it("should only offer Remove for a known Bluetooth device that is not connected", async () => {
      const row = unavailableBleRow();
      const { user } = renderView(discovering([row]));

      await user.press(screen.getByTestId("connect-known-or-new-device-menu-Flex 329"));
      await user.press(screen.getByText("Remove"));

      expect(screen.queryByText("Disconnect")).toBeNull();
      expect(row.remove).toHaveBeenCalledTimes(1);
    });

    it("should only offer Disconnect for a connected USB device", async () => {
      const row = connectedUsbRow();
      const { user } = renderView(discovering([row]));

      await user.press(screen.getByTestId("connect-known-or-new-device-menu-Nano X"));
      await user.press(screen.getByText("Disconnect"));

      expect(screen.queryByText("Remove")).toBeNull();
      expect(row.disconnect).toHaveBeenCalledTimes(1);
    });

    it("should show no menu for an available USB device", () => {
      renderView(discovering([availableUsbRow()]));

      expect(screen.queryByTestId("connect-known-or-new-device-menu-Nano S Plus")).toBeNull();
    });
  });

  describe("Empty state", () => {
    it("should show the Add a Ledger device row and no Add link when there is no device", async () => {
      const addNewDevice = jest.fn();
      const { user } = renderView(discovering([], addNewDevice));

      expect(screen.queryByText("Add")).toBeNull();
      await user.press(screen.getByText("Add a Ledger device"));

      expect(addNewDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe("Show all", () => {
    it("should show the first 3 devices and Show all when there are more", () => {
      renderView(discovering(fiveRows()));

      expect(screen.getByText("C")).toBeVisible();
      expect(screen.queryByText("D")).toBeNull();
      expect(screen.getByText("Show all 5 devices")).toBeVisible();
    });

    it("should show every device and Show less when Show all is pressed", async () => {
      const { user } = renderView(discovering(fiveRows()));

      await user.press(screen.getByText("Show all 5 devices"));

      expect(screen.getByText("E")).toBeVisible();
      expect(screen.getByText("Show less")).toBeVisible();
    });

    it("should show the first 3 devices again when Show less is pressed", async () => {
      const { user } = renderView(discovering(fiveRows()));

      await user.press(screen.getByText("Show all 5 devices"));
      await user.press(screen.getByText("Show less"));

      expect(screen.queryByText("D")).toBeNull();
    });

    it("should not offer Show all for 3 devices", () => {
      renderView(discovering(fiveRows().slice(0, 3)));

      expect(screen.queryByText(/Show all/)).toBeNull();
    });
  });

  describe("Drawers", () => {
    it("should ask to power on and unlock the device while it waits for it", () => {
      const row = makeRow("Flex 329");
      renderView(
        {
          type: ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice,
          devices: [row],
          device: row.device,
          showDeviceNotFound: false,
          addNewDevice: jest.fn(),
          close: jest.fn(),
        },
        [row],
      );

      expect(screen.getByText("Power on and unlock your Ledger Stax")).toBeVisible();
      expect(screen.queryByText("Can't see your Ledger device?")).toBeNull();
    });

    it("should open the Add mode from the hint when the device is not found", async () => {
      const row = makeRow("Flex 329");
      const addNewDevice = jest.fn();
      const { user } = renderView(
        {
          type: ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice,
          devices: [row],
          device: row.device,
          showDeviceNotFound: true,
          addNewDevice,
          close: jest.fn(),
        },
        [row],
      );

      expect(screen.getByText("Can't see your Ledger device?")).toBeVisible();
      await user.press(screen.getByText("Add a Ledger device"));

      expect(addNewDevice).toHaveBeenCalledTimes(1);
    });

    it("should show the connecting view while the device connects", () => {
      const row = makeRow("Flex 329");
      renderView(
        {
          type: ConnectKnownOrNewDeviceUIStateTypes.Connecting,
          devices: [row],
          device: row.device,
          close: jest.fn(),
        },
        [row],
      );

      expect(screen.getByText("Connecting to your Ledger device")).toBeVisible();
    });
  });
});
