import React from "react";
import { render } from "@testing-library/react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { initDmk, resetDmk } from "@ledgerhq/live-dmk-shared";
import {
  useDeviceManagementKit,
  DeviceManagementKitProvider,
} from "./useDeviceManagementKit";

const mockDmk = { id: "mock-dmk" } as unknown as DeviceManagementKit;

const mockBuilder = {
  addTransport: jest.fn().mockReturnThis(),
  addLogger: jest.fn().mockReturnThis(),
  addConfig: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockDmk),
};

jest.mock("@ledgerhq/device-management-kit", () => ({
  ...jest.requireActual("@ledgerhq/device-management-kit"),
  DeviceManagementKitBuilder: jest.fn(() => mockBuilder),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  useFeature: jest.fn(),
}));

import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

const TestComponent: React.FC = () => {
  const dmk = useDeviceManagementKit();
  return <span data-testid="dmk">{dmk ? "has-dmk" : "no-dmk"}</span>;
};

describe("DeviceManagementKitProvider (desktop)", () => {
  beforeEach(() => {
    initDmk({ transports: [jest.fn()] });
  });

  afterEach(() => {
    resetDmk();
    jest.clearAllMocks();
  });

  it("provides DMK when ldmkTransport feature flag is enabled", () => {
    (useFeature as jest.Mock).mockReturnValue({ enabled: true });

    const { getByTestId } = render(
      <DeviceManagementKitProvider>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    expect(getByTestId("dmk")).toHaveTextContent("has-dmk");
  });

  it("provides null when ldmkTransport feature flag is disabled", () => {
    (useFeature as jest.Mock).mockReturnValue({ enabled: false });

    const { getByTestId } = render(
      <DeviceManagementKitProvider>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    expect(getByTestId("dmk")).toHaveTextContent("no-dmk");
  });

  it("provides null when disabled prop is true", () => {
    (useFeature as jest.Mock).mockReturnValue({ enabled: true });

    const { getByTestId } = render(
      <DeviceManagementKitProvider disabled>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    expect(getByTestId("dmk")).toHaveTextContent("no-dmk");
  });
});
