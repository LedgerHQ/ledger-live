import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceSectionView } from "../DeviceSectionView";
import { type DeviceSectionDevice } from "../useDeviceSectionViewModel";

const mockDevices: DeviceSectionDevice[] = [
  { id: "device-1", name: "Flex Pro", modelId: DeviceModelId.europa, available: false },
  { id: "device-2", name: "Flex Perso", modelId: DeviceModelId.europa, available: false },
  { id: "device-3", name: "Flex 3294", modelId: DeviceModelId.europa, available: false },
];

describe("DeviceSection", () => {
  describe("with no devices", () => {
    beforeEach(() => {
      render(<DeviceSectionView devices={[]} />);
    });

    it("renders the section container", () => {
      expect(screen.getByTestId("my-wallet-device-section")).toBeVisible();
    });

    it('renders the section title "My devices"', () => {
      expect(screen.getByTestId("my-wallet-device-section-title")).toBeVisible();
      expect(screen.getByTestId("my-wallet-device-section-title")).toHaveTextContent("My devices");
    });

    it("renders the Add button", () => {
      expect(screen.getByTestId("my-wallet-device-section-add")).toBeVisible();
    });

    it('renders the "Explore all Ledger devices" item', () => {
      expect(screen.getByTestId("my-wallet-device-section-explore")).toBeVisible();
    });

    it("does not render any device item", () => {
      expect(screen.queryByTestId("my-wallet-device-item-device-1")).toBeNull();
    });
  });

  describe("with one device", () => {
    const singleDevice: DeviceSectionDevice[] = [mockDevices[0]];

    beforeEach(() => {
      render(<DeviceSectionView devices={singleDevice} />);
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

    it('renders the "Explore all Ledger devices" item', () => {
      expect(screen.getByTestId("my-wallet-device-section-explore")).toBeVisible();
    });
  });

  describe("with an available device", () => {
    const availableDevice: DeviceSectionDevice[] = [
      { id: "device-1", name: "Flex Pro", modelId: DeviceModelId.europa, available: true },
    ];

    beforeEach(() => {
      render(<DeviceSectionView devices={availableDevice} />);
    });

    it('renders "Available" status', () => {
      expect(screen.getByText("Available")).toBeVisible();
    });
  });

  describe("with multiple devices", () => {
    beforeEach(() => {
      render(<DeviceSectionView devices={mockDevices} />);
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
  });
});
