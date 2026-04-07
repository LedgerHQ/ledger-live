import React from "react";
import { render } from "@testing-library/react";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  DeviceManagementKitProvider,
  useDeviceManagementKit,
} from "./useDeviceManagementKit";
import { initDmk, resetDmk } from "../config/dmkInstance";

const mockDmk = { id: "mock-dmk" } as unknown as DeviceManagementKit;

const mockBuilder = {
  addTransport: jest.fn().mockReturnThis(),
  addLogger: jest.fn().mockReturnThis(),
  addConfig: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockDmk),
};

jest.mock("@ledgerhq/device-management-kit", () => ({
  DeviceManagementKitBuilder: jest.fn(() => mockBuilder),
}));

const Consumer: React.FC = () => {
  const dmk = useDeviceManagementKit();
  return <div data-testid="dmk-value">{dmk ? "has-dmk" : "no-dmk"}</div>;
};

describe("DeviceManagementKitProvider", () => {
  afterEach(() => {
    resetDmk();
    jest.clearAllMocks();
  });

  it("provides the DMK instance to children", () => {
    initDmk({ transports: [jest.fn()] });

    const { getByTestId } = render(
      <DeviceManagementKitProvider>
        <Consumer />
      </DeviceManagementKitProvider>,
    );

    expect(getByTestId("dmk-value")).toHaveTextContent("has-dmk");
  });

  it("provides null when disabled", () => {
    initDmk({ transports: [jest.fn()] });

    const { getByTestId } = render(
      <DeviceManagementKitProvider disabled>
        <Consumer />
      </DeviceManagementKitProvider>,
    );

    expect(getByTestId("dmk-value")).toHaveTextContent("no-dmk");
  });

  it("renders children even when disabled", () => {
    initDmk({ transports: [jest.fn()] });

    const { getByTestId } = render(
      <DeviceManagementKitProvider disabled>
        <div data-testid="child">hello</div>
      </DeviceManagementKitProvider>,
    );

    expect(getByTestId("child")).toHaveTextContent("hello");
  });
});

describe("useDeviceManagementKit", () => {
  afterEach(() => {
    resetDmk();
    jest.clearAllMocks();
  });

  it("returns null when used outside a provider", () => {
    const { getByTestId } = render(<Consumer />);
    expect(getByTestId("dmk-value")).toHaveTextContent("no-dmk");
  });
});
