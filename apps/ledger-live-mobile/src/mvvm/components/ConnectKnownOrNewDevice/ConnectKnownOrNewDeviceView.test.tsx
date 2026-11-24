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
  isPaused: false,
  devices,
  addNewDevice,
});

const pausedDiscovering = (devices: Array<DeviceListItem>): ConnectKnownOrNewDeviceUIState => ({
  type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
  isPaused: true,
  devices,
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
    it("GIVEN connected, available and unavailable devices, WHEN the list renders, THEN it should show the status of each device", () => {
      // GIVEN / WHEN
      renderView(discovering([connectedBleRow(), availableUsbRow(), unavailableBleRow()]));

      // THEN
      expect(screen.getByText("Connected")).toBeVisible();
      expect(screen.getByText("Available")).toBeVisible();
      expect(screen.getByText("Not connected")).toBeVisible();
    });

    it("GIVEN an available device, WHEN its row is pressed, THEN it should connect the device", async () => {
      // GIVEN
      const row = availableUsbRow();
      const { user } = renderView(discovering([row]));

      // WHEN
      await user.press(screen.getByText("Nano S Plus"));

      // THEN
      expect(row.connect).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a device list, WHEN the Add link above the list is pressed, THEN it should call addNewDevice", async () => {
      // GIVEN
      const addNewDevice = jest.fn();
      const { user } = renderView(discovering([unavailableBleRow()], addNewDevice));

      // WHEN
      await user.press(screen.getByText("Add new"));

      // THEN
      expect(addNewDevice).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a state without device actions, WHEN the list renders, THEN it should show no menu on the rows", () => {
      // GIVEN / WHEN
      renderView(
        {
          type: ConnectKnownOrNewDeviceUIStateTypes.Connecting,
          devices: [makeRow("Flex 329")],
          device: makeRow("Flex 329").device,
          close: jest.fn(),
        },
        [makeRow("Flex 329")],
      );

      // THEN
      expect(screen.queryByTestId("connect-known-or-new-device-menu-Flex 329")).toBeNull();
      expect(screen.queryByText("Add new")).toBeNull();
    });
  });

  describe("Menu", () => {
    it("GIVEN the open menu of a connected Bluetooth device, WHEN Disconnect is pressed, THEN it should disconnect the device", async () => {
      // GIVEN
      const row = connectedBleRow();
      const { user } = renderView(discovering([row]));
      await user.press(screen.getByTestId("connect-known-or-new-device-menu-Stax 2"));
      expect(screen.getByText("Remove")).toBeVisible();

      // WHEN
      await user.press(screen.getByText("Disconnect"));

      // THEN
      expect(row.disconnect).toHaveBeenCalledTimes(1);
      expect(row.remove).not.toHaveBeenCalled();
    });

    it("GIVEN the open menu of a connected Bluetooth device, WHEN Remove is pressed, THEN it should remove the device", async () => {
      // GIVEN
      const row = connectedBleRow();
      const { user } = renderView(discovering([row]));
      await user.press(screen.getByTestId("connect-known-or-new-device-menu-Stax 2"));

      // WHEN
      await user.press(screen.getByText("Remove"));

      // THEN
      expect(row.remove).toHaveBeenCalledTimes(1);
    });

    it("GIVEN the open menu of a known Bluetooth device that is not connected, WHEN Remove is pressed, THEN it should only offer Remove", async () => {
      // GIVEN
      const row = unavailableBleRow();
      const { user } = renderView(discovering([row]));
      await user.press(screen.getByTestId("connect-known-or-new-device-menu-Flex 329"));

      // WHEN
      await user.press(screen.getByText("Remove"));

      // THEN
      expect(screen.queryByText("Disconnect")).toBeNull();
      expect(row.remove).toHaveBeenCalledTimes(1);
    });

    it("GIVEN the open menu of a connected USB device, WHEN Disconnect is pressed, THEN it should only offer Disconnect", async () => {
      // GIVEN
      const row = connectedUsbRow();
      const { user } = renderView(discovering([row]));
      await user.press(screen.getByTestId("connect-known-or-new-device-menu-Nano X"));

      // WHEN
      await user.press(screen.getByText("Disconnect"));

      // THEN
      expect(screen.queryByText("Remove")).toBeNull();
      expect(row.disconnect).toHaveBeenCalledTimes(1);
    });

    it("GIVEN an available USB device, WHEN the list renders, THEN it should show no menu for it", () => {
      // GIVEN / WHEN
      renderView(discovering([availableUsbRow()]));

      // THEN
      expect(screen.queryByTestId("connect-known-or-new-device-menu-Nano S Plus")).toBeNull();
    });
  });

  describe("Paused", () => {
    it("GIVEN a paused flow, WHEN the list renders, THEN it should show the rows disabled and the Add link", () => {
      // GIVEN / WHEN
      const row = makeRow("Flex 329");
      renderView(pausedDiscovering([row]));

      // THEN
      expect(screen.getByTestId(`connect-known-or-new-device-row-${row.key}`)).toBeDisabled();
      expect(screen.getByText("Add new")).toBeVisible();
    });

    it("GIVEN a paused flow and no device, WHEN the list renders, THEN it should show the Add a Ledger device row disabled", () => {
      // GIVEN / WHEN
      renderView(pausedDiscovering([]));

      // THEN
      expect(screen.getByTestId("connect-known-or-new-device-add-device")).toBeDisabled();
    });

    it("GIVEN the device is not found while the flow is paused, WHEN the hint shows, THEN its Add a Ledger device button should be disabled", () => {
      // GIVEN / WHEN
      const row = makeRow("Flex 329");
      renderView(
        {
          type: ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice,
          devices: [row],
          device: row.device,
          showDeviceNotFound: true,
          close: jest.fn(),
        },
        [row],
      );

      // THEN
      expect(screen.getByText("Add a Ledger device")).toBeDisabled();
    });
  });

  describe("Empty state", () => {
    it("GIVEN no device and no Add link, WHEN the Add a Ledger device row is pressed, THEN it should call addNewDevice", async () => {
      // GIVEN
      const addNewDevice = jest.fn();
      const { user } = renderView(discovering([], addNewDevice));
      expect(screen.queryByText("Add new")).toBeNull();

      // WHEN
      await user.press(screen.getByText("Add a Ledger device"));

      // THEN
      expect(addNewDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe("Show all", () => {
    it("GIVEN more than 3 devices, WHEN the list renders, THEN it should show the first 3 devices and Show all", () => {
      // GIVEN / WHEN
      renderView(discovering(fiveRows()));

      // THEN
      expect(screen.getByText("C")).toBeVisible();
      expect(screen.queryByText("D")).toBeNull();
      expect(screen.getByText("Show all 5 devices")).toBeVisible();
    });

    it("GIVEN more than 3 devices, WHEN Show all is pressed, THEN it should show every device and Show less", async () => {
      // GIVEN
      const { user } = renderView(discovering(fiveRows()));

      // WHEN
      await user.press(screen.getByText("Show all 5 devices"));

      // THEN
      expect(screen.getByText("E")).toBeVisible();
      expect(screen.getByText("Show less")).toBeVisible();
    });

    it("GIVEN every device is shown, WHEN Show less is pressed, THEN it should show the first 3 devices again", async () => {
      // GIVEN
      const { user } = renderView(discovering(fiveRows()));
      await user.press(screen.getByText("Show all 5 devices"));

      // WHEN
      await user.press(screen.getByText("Show less"));

      // THEN
      expect(screen.queryByText("D")).toBeNull();
    });

    it("GIVEN 3 devices, WHEN the list renders, THEN it should not offer Show all", () => {
      // GIVEN / WHEN
      renderView(discovering(fiveRows().slice(0, 3)));

      // THEN
      expect(screen.queryByText(/Show all/)).toBeNull();
    });
  });

  describe("Drawers", () => {
    it("GIVEN the flow waits for the device, WHEN the view renders, THEN it should ask to power on and unlock the device", () => {
      // GIVEN / WHEN
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

      // THEN
      expect(screen.getByText("Power on and unlock your Ledger Stax")).toBeVisible();
      expect(screen.queryByText("Can't see your Ledger device?")).toBeNull();
    });

    it("GIVEN the device is not found, WHEN Add a Ledger device is pressed in the hint, THEN it should open the Add mode", async () => {
      // GIVEN
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

      // WHEN
      await user.press(screen.getByText("Add a Ledger device"));

      // THEN
      expect(addNewDevice).toHaveBeenCalledTimes(1);
    });

    it("GIVEN the device is connecting, WHEN the view renders, THEN it should show the connecting view", () => {
      // GIVEN / WHEN
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

      // THEN
      expect(screen.getByText("Connecting to your Ledger device")).toBeVisible();
    });
  });
});
