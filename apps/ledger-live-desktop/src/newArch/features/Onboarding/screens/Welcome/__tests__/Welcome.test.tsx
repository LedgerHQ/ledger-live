/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { Welcome } from "../index";

// Mock the feature flag
const mockUseFeature = jest.fn();
jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  useFeature: () => mockUseFeature(),
}));

// Mock the child components
jest.mock("../WelcomeNew", () => ({
  WelcomeNew: () => <div data-testid="welcome-new">Welcome New Component</div>,
}));

jest.mock("../WelcomeOld", () => ({
  WelcomeOld: () => <div data-testid="welcome-old">Welcome Old Component</div>,
}));

describe("Welcome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render WelcomeNew when feature flag is enabled", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    render(<Welcome />);

    expect(screen.getByTestId("welcome-new")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-old")).not.toBeInTheDocument();
  });

  it("should render WelcomeOld when feature flag is disabled", () => {
    mockUseFeature.mockReturnValue({ enabled: false });

    render(<Welcome />);

    expect(screen.getByTestId("welcome-old")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-new")).not.toBeInTheDocument();
  });

  it("should render WelcomeOld when feature flag is undefined", () => {
    mockUseFeature.mockReturnValue(undefined);

    render(<Welcome />);

    expect(screen.getByTestId("welcome-old")).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-new")).not.toBeInTheDocument();
  });
});
