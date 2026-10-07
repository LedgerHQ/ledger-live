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
