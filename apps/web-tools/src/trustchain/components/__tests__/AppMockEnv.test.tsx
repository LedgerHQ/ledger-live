import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppMockEnv } from "../AppMockEnv";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    Button: ({ children, ...props }: React.ComponentProps<"button">) =>
      React.createElement("button", props, children),
    Spinner: () => null,
    Tag: ({ label }: { label: string }) => React.createElement("span", null, label),
  };
});

jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-app-mock-env"),
}));

const mockSetEnv = jest.fn();
jest.mock("@shared/env", () => ({
  setEnv: (...args: unknown[]) => Reflect.apply(mockSetEnv, null, args),
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
