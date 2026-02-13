import React from "react";
import { render } from "@testing-library/react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  getDeviceManagementKit,
  useDeviceManagementKit,
  DeviceManagementKitProvider,
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
