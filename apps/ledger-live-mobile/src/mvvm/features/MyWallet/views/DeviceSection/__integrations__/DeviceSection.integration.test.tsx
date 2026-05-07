import React from "react";
import { render, screen, fireEvent, waitFor } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceSectionView } from "../DeviceSectionView";
import { type DeviceSectionDevice } from "../useDeviceSectionViewModel";

jest.mock("~/components/DeviceActionModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("~/hooks/deviceActions", () => ({
  useManagerDeviceAction: () => ({
    useHook: jest.fn(),
    mapResult: jest.fn(),
  }),
}));

const mockDevices: DeviceSectionDevice[] = [
  { id: "device-1", name: "Flex Pro", modelId: DeviceModelId.europa, available: false },
  { id: "device-2", name: "Flex Perso", modelId: DeviceModelId.europa, available: false },
  { id: "device-3", name: "Flex 3294", modelId: DeviceModelId.europa, available: false },
];

const mockOnAddDevice = jest.fn();
const mockOnExploreDevices = jest.fn();
const mockOnDevicePress = jest.fn();
const mockOnOpenMenu = jest.fn();
const mockOnCloseRemoveMenu = jest.fn();
const mockOnRemoveDevice = jest.fn();
const mockOnDeviceActionResult = jest.fn();
const mockOnDeviceActionClose = jest.fn();
const mockOnDeviceActionError = jest.fn();

const mockManagerAction = { useHook: jest.fn(), mapResult: jest.fn() } as const;

const renderView = (
  devices: readonly DeviceSectionDevice[],
  overrides: Partial<{
    deviceToRemove: DeviceSectionDevice | null;
    isRemoveDrawerOpen: boolean;
  }> = {},
) =>
  render(
    <DeviceSectionView
      devices={devices}
      hasDevices={devices.length > 0}
      onAddDevice={mockOnAddDevice}
      onExploreDevices={mockOnExploreDevices}
      onDevicePress={mockOnDevicePress}
      onOpenMenu={mockOnOpenMenu}
      deviceToRemove={overrides.deviceToRemove ?? null}
      isRemoveDrawerOpen={overrides.isRemoveDrawerOpen ?? false}
      onCloseRemoveMenu={mockOnCloseRemoveMenu}
      onRemoveDevice={mockOnRemoveDevice}
      selectedDevice={null}
      managerAction={mockManagerAction}
      onDeviceActionResult={mockOnDeviceActionResult}
      onDeviceActionClose={mockOnDeviceActionClose}
      onDeviceActionError={mockOnDeviceActionError}
    />,
  );

describe("DeviceSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("device card press", () => {
    beforeEach(() => {
      renderView([mockDevices[0]]);
    });

    it("calls onDevicePress with the device when tapped", async () => {
      fireEvent.press(screen.getByTestId("my-wallet-device-item-device-1"));
      await waitFor(() => expect(mockOnDevicePress).toHaveBeenCalledWith(mockDevices[0]));
    });
  });

  describe("with no devices", () => {
    beforeEach(() => {
      renderView([]);
    });

    it("renders the section container", () => {
      expect(screen.getByTestId("my-wallet-device-section")).toBeVisible();
    });

    it('renders the section title "My devices"', () => {
      expect(screen.getByTestId("my-wallet-device-section-title")).toBeVisible();
      expect(screen.getByTestId("my-wallet-device-section-title")).toHaveTextContent("My devices");
    });

    it("renders the Add button and calls onAddDevice when pressed", async () => {
      expect(screen.getByTestId("my-wallet-device-section-add-device")).toBeVisible();
      fireEvent.press(screen.getByTestId("my-wallet-device-section-add-device"));
      await waitFor(() => expect(mockOnAddDevice).toHaveBeenCalledTimes(1));
    });

    it('does not render the "Explore all Ledger devices" item', () => {
      expect(screen.queryByTestId("my-wallet-device-section-explore")).toBeNull();
    });

    it("does not render any device item", () => {
      expect(screen.queryByTestId("my-wallet-device-item-device-1")).toBeNull();
    });
  });

  describe("with one device", () => {
    const singleDevice: DeviceSectionDevice[] = [mockDevices[0]];

    beforeEach(() => {
      renderView(singleDevice);
    });

    it("renders the device item", () => {
      expect(screen.getByTestId("my-wallet-device-item-device-1")).toBeVisible();
    });

    it("renders the device name", () => {
      expect(screen.getByText("Flex Pro")).toBeVisible();
    });

    it('renders "Not connected" status', () => {
      expect(screen.getByText("Not connected")).toBeVisible();
    });

    it("renders the Add header link", () => {
      expect(screen.getByTestId("my-wallet-device-section-add")).toBeVisible();
    });

    it('does not render the "Add a Ledger device" CTA', () => {
      expect(screen.queryByTestId("my-wallet-device-section-add-device")).toBeNull();
    });

    it('renders the "Explore all Ledger devices" item', () => {
      expect(screen.getByTestId("my-wallet-device-section-explore")).toBeVisible();
    });

    it("calls onOpenMenu with the device when the 3-dot menu icon is pressed", async () => {
      fireEvent.press(screen.getByTestId("my-wallet-device-item-device-1-menu"));
      await waitFor(() => expect(mockOnOpenMenu).toHaveBeenCalledWith(mockDevices[0]));
    });
  });

  describe("with an available device", () => {
    const availableDevice: DeviceSectionDevice[] = [
      { id: "device-1", name: "Flex Pro", modelId: DeviceModelId.europa, available: true },
    ];

    beforeEach(() => {
      renderView(availableDevice);
    });

    it('renders "Available" status', () => {
      expect(screen.getByText("Available")).toBeVisible();
    });
  });

  describe("with multiple devices", () => {
    beforeEach(() => {
      renderView(mockDevices);
    });

    it("renders all device items", () => {
      expect(screen.getByTestId("my-wallet-device-item-device-1")).toBeVisible();
      expect(screen.getByTestId("my-wallet-device-item-device-2")).toBeVisible();
      expect(screen.getByTestId("my-wallet-device-item-device-3")).toBeVisible();
    });

    it("renders all device names", () => {
      expect(screen.getByText("Flex Pro")).toBeVisible();
      expect(screen.getByText("Flex Perso")).toBeVisible();
      expect(screen.getByText("Flex 3294")).toBeVisible();
    });

    it('renders the "Explore all Ledger devices" item', () => {
      expect(screen.getByTestId("my-wallet-device-section-explore")).toBeVisible();
    });

    it("renders a menu icon for each device", () => {
      expect(screen.getByTestId("my-wallet-device-item-device-1-menu")).toBeVisible();
      expect(screen.getByTestId("my-wallet-device-item-device-2-menu")).toBeVisible();
      expect(screen.getByTestId("my-wallet-device-item-device-3-menu")).toBeVisible();
    });
  });
});
