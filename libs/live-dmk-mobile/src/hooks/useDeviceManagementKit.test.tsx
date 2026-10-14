import React from "react";
import { render } from "@testing-library/react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  getDeviceManagementKit,
  useDeviceManagementKit,
  DeviceManagementKitProvider,
  setFirmwareDistributionSalt,
} from "./useDeviceManagementKit";

const TestComponent: React.FC = () => {
  const dmk = useDeviceManagementKit();
  return <span data-testid="dmk-test-component">{JSON.stringify(dmk)}</span>;
};

describe("getDeviceManagementKit method", () => {
  it("returns singleton instance", () => {
    // given
    const baseInstance = getDeviceManagementKit();
    // when
    const newInstance = getDeviceManagementKit();
    // then
    expect(newInstance).toBe(baseInstance);
  });
  it("instance is of type DeviceManagementKit", () => {
    // when
    const dmkInstance = getDeviceManagementKit();
    // then
    expect(dmkInstance).toBeInstanceOf(DeviceManagementKit);
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

describe("useDeviceManagementKit hook", () => {
  it("returns dmk instance when used inside provider with feature enabled", () => {
    // when
    const { getByTestId } = render(
      <DeviceManagementKitProvider>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    // then
    expect(getByTestId("dmk-test-component").textContent).toBe(
      JSON.stringify(getDeviceManagementKit()),
    );
  });
});

describe("<DeviceManagementKitProvider /> provider", () => {
  it("provides a dmk instance to child element if feature flag enabled", () => {
    // when
    const { getByTestId } = render(
      <DeviceManagementKitProvider>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    // then
    expect(getByTestId("dmk-test-component").textContent).toBe(
      JSON.stringify(getDeviceManagementKit()),
    );
  });
});
