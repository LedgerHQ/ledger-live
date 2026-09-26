import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import VoteDelegationValidationSuccess from "./04-ValidationSuccess";
import { ScreenName } from "~/const";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

const mockPop = jest.fn();
const mockNavigate = jest.fn();

const mockNavigation = {
  getParent: () => ({ pop: mockPop }),
  navigate: mockNavigate,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockRoute = {
  params: {
    accountId: "account-id",
    result: { hash: "tx-hash-123" },
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("VoteDelegationValidationSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render successfully with success messages", () => {
    (useAccountScreen as jest.Mock).mockReturnValue({
      account: { id: "account-id", type: "Account", currency: { id: "cardano" } },
    });

    render(<VoteDelegationValidationSuccess navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByText("Vote Delegation Successful")).toBeDefined();
    expect(screen.getByText("You have successfully delegated your vote.")).toBeDefined();
  });

  it("should close flow when close button is pressed", () => {
    (useAccountScreen as jest.Mock).mockReturnValue({
      account: { id: "account-id", type: "Account", currency: { id: "cardano" } },
    });

    render(<VoteDelegationValidationSuccess navigation={mockNavigation} route={mockRoute} />);
    const closeBtn = screen.getByTestId("enabled-success-close-button");
    fireEvent.press(closeBtn);
    expect(mockPop).toHaveBeenCalled();
  });

  it("should navigate to operation details when details button is pressed", () => {
    (useAccountScreen as jest.Mock).mockReturnValue({
      account: { id: "account-id", type: "Account", currency: { id: "cardano" } },
    });

    render(<VoteDelegationValidationSuccess navigation={mockNavigation} route={mockRoute} />);
    const detailsBtn = screen.getByText("View details");
    fireEvent.press(detailsBtn);
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
      accountId: "account-id",
      operation: { hash: "tx-hash-123" },
    });
  });
});
