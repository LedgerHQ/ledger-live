import React from "react";
import { render } from "@testing-library/react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { initDmk, resetDmk } from "@ledgerhq/live-dmk-shared";
import {
  getDeviceManagementKit,
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

const TestComponent: React.FC = () => {
  const dmk = useDeviceManagementKit();
  return <span data-testid="dmk-test-component">{dmk ? "has-dmk" : "no-dmk"}</span>;
};

describe("getDeviceManagementKit (re-exported from shared)", () => {
  beforeEach(() => {
    initDmk({ transports: [jest.fn()] });
  });

  afterEach(() => {
    resetDmk();
    jest.clearAllMocks();
  });

  it("returns the initialized singleton", () => {
    const instance = getDeviceManagementKit();
    expect(instance).toBe(mockDmk);
  });

  it("returns the same instance on repeated calls", () => {
    const first = getDeviceManagementKit();
    const second = getDeviceManagementKit();
    expect(first).toBe(second);
  });
});

describe("DeviceManagementKitProvider (mobile)", () => {
  beforeEach(() => {
    initDmk({ transports: [jest.fn()] });
  });

  afterEach(() => {
    resetDmk();
    jest.clearAllMocks();
  });

  it("provides DMK instance to children", () => {
    const { getByTestId } = render(
      <DeviceManagementKitProvider>
        <TestComponent />
      </DeviceManagementKitProvider>,
    );

    expect(getByTestId("dmk-test-component")).toHaveTextContent("has-dmk");
  });
});
