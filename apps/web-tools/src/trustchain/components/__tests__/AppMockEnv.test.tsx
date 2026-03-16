import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppMockEnv } from "../AppMockEnv";

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-app-mock-env"),
}));

const mockSetEnv = jest.fn();
jest.mock("@ledgerhq/live-env", () => ({
  setEnv: (...args: unknown[]) => Reflect.apply(mockSetEnv, null, args),
  getEnv: jest.fn(() => ""),
  changes: { subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })) },
}));

const mockUseEnv = jest.fn(() => "");
jest.mock("../../useEnv", () => ({
  __esModule: true,
  default: (...args: unknown[]) => Reflect.apply(mockUseEnv, null, args),
}));

describe("AppMockEnv", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEnv.mockReturnValue("");
  });

  it("should call setEnv with uuid when toggling mock env from unset", async () => {
    const user = userEvent.setup();
    render(<AppMockEnv />);

    const button = screen.getByRole("button", { name: /Toggle Mock Env/i });
    await user.click(button);

    expect(mockSetEnv).toHaveBeenCalledWith("MOCK", "mock-uuid-app-mock-env");
  });

  it("should call setEnv with empty string when toggling mock env from set", async () => {
    mockUseEnv.mockReturnValue("existing-mock-id");
    const user = userEvent.setup();
    render(<AppMockEnv />);

    const button = screen.getByRole("button", { name: /Toggle Mock Env/i });
    await user.click(button);

    expect(mockSetEnv).toHaveBeenCalledWith("MOCK", "");
  });
});
