import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  getDeviceManagementKit,
  useDeviceManagementKit,
  DeviceManagementKitProvider,
  useDeviceManagementKitEnabled,
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
      <DeviceManagementKitProvider dmkEnabled={true}>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    // then
    expect(getByTestId("dmk-test-component").textContent).toBe(
      JSON.stringify(getDeviceManagementKit()),
    );
  });

  it("returns null when used inside provider with feature disabled", () => {
    // when
    const { getByTestId } = render(
      <DeviceManagementKitProvider dmkEnabled={false}>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    // then
    expect(getByTestId("dmk-test-component").textContent).toBe(JSON.stringify(null));
  });
});

describe("<DeviceManagementKitProvider /> provider", () => {
  it("provides a dmk instance to child element if feature flag enabled", () => {
    // when
    const { getByTestId } = render(
      <DeviceManagementKitProvider dmkEnabled={true}>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    // then
    expect(getByTestId("dmk-test-component").textContent).toBe(
      JSON.stringify(getDeviceManagementKit()),
    );
  });

  it("renders children without provider context if feature flag disabled", () => {
    // when
    const { getByTestId } = render(
      <DeviceManagementKitProvider dmkEnabled={false}>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    // then
    expect(getByTestId("dmk-test-component").textContent).toBe(JSON.stringify(null));
  });
});

describe("useDeviceManagementKitEnabled hook", () => {
  it("returns true when DMK is enabled in provider", () => {
    // given
    const TestHookComponent: React.FC = () => {
      const isEnabled = useDeviceManagementKitEnabled();
      return <span data-testid="is-enabled">{isEnabled ? "true" : "false"}</span>;
    };

    // when
    const { getByTestId } = render(
      <DeviceManagementKitProvider dmkEnabled={true}>
        <TestHookComponent />
      </DeviceManagementKitProvider>,
    );

    // then
    expect(getByTestId("is-enabled").textContent).toBe("true");
  });

  it("returns false when DMK is disabled in provider", () => {
    // given
    const TestHookComponent: React.FC = () => {
      const isEnabled = useDeviceManagementKitEnabled();
      return <span data-testid="is-enabled">{isEnabled ? "true" : "false"}</span>;
    };

    // when
    const { getByTestId } = render(
      <DeviceManagementKitProvider dmkEnabled={false}>
        <TestHookComponent />
      </DeviceManagementKitProvider>,
    );

    // then
    expect(getByTestId("is-enabled").textContent).toBe("false");
  });
});
