import React from "react";
import { getEnv, setEnv } from "@shared/env";
import { render, screen } from "tests/testSetup";
import EnableMockServerTransportToggle from "./EnableMockServerTransportToggle";
import { MOCK_SERVER_TRANSPORT_STORAGE_KEY } from "~/renderer/mockServerTransport";

const mockSetEnvOnAllThreads = jest.fn();
jest.mock("~/helpers/env", () => ({
  setEnvOnAllThreads: (name: string, value: unknown) => mockSetEnvOnAllThreads(name, value),
}));

const mockReloadRenderer = jest.fn();

describe("EnableMockServerTransportToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    setEnv("MOCK_SERVER_TRANSPORT", false);
    window.api = { reloadRenderer: mockReloadRenderer } as never;
  });

  afterEach(() => {
    setEnv("MOCK_SERVER_TRANSPORT", false);
  });

  const theSwitch = () => screen.getByTestId("settings-enable-mock-server-transport");

  it("starts from the env value", () => {
    setEnv("MOCK_SERVER_TRANSPORT", true);

    render(<EnableMockServerTransportToggle />);

    expect(theSwitch()).toBeChecked();
  });

  it("persists the choice and reloads so the boot path re-runs", async () => {
    const { user } = render(<EnableMockServerTransportToggle />);
    expect(theSwitch()).not.toBeChecked();

    await user.click(theSwitch());

    expect(mockSetEnvOnAllThreads).toHaveBeenCalledWith("MOCK_SERVER_TRANSPORT", true);
    expect(window.localStorage.getItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY)).toBe("1");
    expect(mockReloadRenderer).toHaveBeenCalledTimes(1);
    expect(theSwitch()).toBeChecked();
  });

  it("stores a zero when turned back off", async () => {
    setEnv("MOCK_SERVER_TRANSPORT", true);
    const { user } = render(<EnableMockServerTransportToggle />);

    await user.click(theSwitch());

    expect(mockSetEnvOnAllThreads).toHaveBeenCalledWith("MOCK_SERVER_TRANSPORT", false);
    expect(window.localStorage.getItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY)).toBe("0");
    expect(getEnv("MOCK_SERVER_TRANSPORT")).toBe(true);
  });
});
