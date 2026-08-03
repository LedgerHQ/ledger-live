import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import VoteDelegationValidationError from "./04-ValidationError";

const mockPop = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  getParent: () => ({ pop: mockPop }),
  goBack: mockGoBack,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockRoute = {
  params: {
    accountId: "account-id",
    error: new Error("Test error message"),
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("VoteDelegationValidationError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render error message", () => {
    render(<VoteDelegationValidationError navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByText("Test error message")).toBeDefined();
  });

  it("should navigate back when retry is pressed", () => {
    render(<VoteDelegationValidationError navigation={mockNavigation} route={mockRoute} />);
    const retryBtn = screen.getByTestId("proceed-button");
    fireEvent.press(retryBtn);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it("should close flow when close is pressed", () => {
    render(<VoteDelegationValidationError navigation={mockNavigation} route={mockRoute} />);
    const closeBtn = screen.getByTestId("SendErrorClose");
    fireEvent.press(closeBtn);
    expect(mockPop).toHaveBeenCalled();
  });
});
