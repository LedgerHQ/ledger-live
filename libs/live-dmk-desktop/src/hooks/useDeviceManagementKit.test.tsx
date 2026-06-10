import {
  getDeviceManagementKit,
  useDeviceManagementKit,
  DeviceManagementKitProvider,
} from "./useDeviceManagementKit";
import React from "react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { render } from "@testing-library/react";

const TestComponent: React.FC = () => {
  const dmk = useDeviceManagementKit();

  return (
    <DeviceManagementKitProvider ldmkTransportEnabled={false}>
      <span data-testid="dmk">{JSON.stringify(dmk)}</span>
    </DeviceManagementKitProvider>
  );
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
  describe("<DeviceManagementKitProvider />", () => {
    it("provides a dmk instance to child element if enabled", async () => {
      // given
      const { getByTestId } = render(
        <DeviceManagementKitProvider ldmkTransportEnabled>
          <TestComponent />
        </DeviceManagementKitProvider>,
      );
      // when
      const dmkStr = getByTestId("dmk");
      // then
      expect(dmkStr).toHaveTextContent(JSON.stringify(getDeviceManagementKit()));
    });
    it("provides children if not enabled", () => {
      // given
      const { getByTestId } = render(
        <DeviceManagementKitProvider ldmkTransportEnabled={false}>
          <TestComponent />
        </DeviceManagementKitProvider>,
      );
      // when
      const dmkStr = getByTestId("dmk");
      // then
      expect(dmkStr).toHaveTextContent(JSON.stringify(null));
    });
  });
});
