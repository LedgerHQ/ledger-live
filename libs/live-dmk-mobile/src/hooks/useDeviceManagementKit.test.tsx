import {
  getDeviceManagementKit,
  useDeviceManagementKit,
  DeviceManagementKitProvider,
} from "./useDeviceManagementKit";
import * as ffUtils from "./useLdmkFeatureEnabled";
import React from "react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { render } from "@testing-library/react";
import { expect } from "vitest";

const TestComponent: React.FC = () => {
  const dmk = useDeviceManagementKit();

  return (
    <DeviceManagementKitProvider>
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
    it("provides a dmk instance to child element if feature flag enabled", async () => {
      // given
      vi.spyOn(ffUtils, "useLdmkFeatureEnabled").mockReturnValue(true);
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
    it("provides children if feature flag disabled", () => {
      // given
      vi.spyOn(ffUtils, "useLdmkFeatureEnabled").mockReturnValue(false);
      const { getByTestId } = render(
        <DeviceManagementKitProvider>
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
