import {
  getDeviceManagementKit,
  useDeviceManagementKit,
  DeviceManagementKitProvider,
  setFirmwareDistributionSalt,
} from "./useDeviceManagementKit";
import React from "react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { render } from "@testing-library/react";

const TestComponent: React.FC = () => {
  const dmk = useDeviceManagementKit();

  return <span data-testid="dmk">{JSON.stringify(dmk)}</span>;
};

describe("useDeviceManagementKit", () => {
  describe("getDeviceManagementKit", () => {
    it("returns same instance", () => {
      // given
      const baseInstance = getDeviceManagementKit();
      // when
      const newInstance = getDeviceManagementKit();
      // then
      expect(newInstance).toStrictEqual(baseInstance);
    });
    it("returns an instance of DeviceManagementKit", () => {
      // given
      const dmk = getDeviceManagementKit();
      // then
      expect(dmk).toBeInstanceOf(DeviceManagementKit);
    });
  });
  describe("setFirmwareDistributionSalt", () => {
    it("updates the salt of a DMK that already exists", () => {
      // given
      const dmk = getDeviceManagementKit();
      // when
      setFirmwareDistributionSalt("a1b2c3");
      // then
      expect(dmk.getFirmwareDistributionSalt()).toBe("a1b2c3");
    });
    it("builds the next DMK with the salt set before", async () => {
      await jest.isolateModulesAsync(async () => {
        // given
        const module = await import("./useDeviceManagementKit");
        module.setFirmwareDistributionSalt("a1b2c3");
        // when
        const dmk = module.getDeviceManagementKit();
        // then
        expect(dmk.getFirmwareDistributionSalt()).toBe("a1b2c3");
      });
    });
    it("does not build a DMK when none exists yet", async () => {
      await jest.isolateModulesAsync(async () => {
        // given
        const { DeviceManagementKitBuilder } = await import("@ledgerhq/device-management-kit");
        const build = jest.spyOn(DeviceManagementKitBuilder.prototype, "build");
        const module = await import("./useDeviceManagementKit");
        // when
        module.setFirmwareDistributionSalt("a1b2c3");
        // then
        expect(build).not.toHaveBeenCalled();
        build.mockRestore();
      });
    });
  });
  describe("<DeviceManagementKitProvider />", () => {
    it("provides a dmk instance to child element", () => {
      // given
      const { getByTestId } = render(
        <DeviceManagementKitProvider>
          <TestComponent />
        </DeviceManagementKitProvider>,
      );
      // when
      const dmkStr = getByTestId("dmk");
      // then
      expect(dmkStr).toHaveTextContent(JSON.stringify(getDeviceManagementKit()));
    });
    it("throws outside the provider", () => {
      // given
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      // when
      const renderOutsideProvider = () => render(<TestComponent />);
      // then
      expect(renderOutsideProvider).toThrow(
        "useDeviceManagementKit must be used within a DeviceManagementKitProvider",
      );
      consoleError.mockRestore();
    });
  });
});
