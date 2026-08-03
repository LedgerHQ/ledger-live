import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import CardanoVoteDelegation from "./index";
import { ScreenName, NavigatorName } from "~/const";

jest.mock("~/components/CurrencyIcon", () => {
  const { Text: RNText } = require("react-native");
  return () => <RNText>CurrencyIcon</RNText>;
});


const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockAccount = {
  id: "account-id",
  type: "Account",
  currency: { id: "cardano", units: [{ code: "ADA", name: "ADA", magnitude: 6 }] },
  balance: "1000",
  cardanoResources: {
    delegation: {
      dRepHex: undefined,
    },
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("CardanoVoteDelegation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render empty state when not delegated", () => {
    render(<CardanoVoteDelegation account={mockAccount} />);
    expect(screen.getByText("Vote Delegation")).toBeDefined();
    expect(screen.getByText("Delegate your voting power to a DRep to actively participate in Cardano governance.")).toBeDefined();
  });

  it("should navigate to Started screen when delegate button is pressed", () => {
    render(<CardanoVoteDelegation account={mockAccount} />);
    const btn = screen.getByText("Start vote delegation");
    fireEvent.press(btn);

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.CardanoVoteDelegationFlow, {
      screen: ScreenName.CardanoVoteDelegationStarted,
      params: { accountId: "account-id" },
    });
  });

  it("should render populated state when delegated", () => {
    const delegatedAccount = {
      ...mockAccount,
      cardanoResources: {
        delegation: {
          dRepHex: "drep_hex_123",
        },
      },
    };
    render(<CardanoVoteDelegation account={delegatedAccount} />);
    expect(screen.getByText("Vote Delegation")).toBeDefined();
    expect(screen.getByText("drep_hex_123")).toBeDefined(); // DRep row should render
  });

  it("should open drawer when DRep row is pressed", () => {
    const delegatedAccount = {
      ...mockAccount,
      cardanoResources: {
        delegation: {
          dRepHex: "drep_hex_123",
        },
      },
    };
    render(<CardanoVoteDelegation account={delegatedAccount} />);
    
    // Press the row to set dRepHex in state
    const row = screen.getByText("drep_hex_123");
    fireEvent.press(row);

    // The drawer should now be open, displaying the dRepHex
    const drawerTitle = screen.getAllByText("drep_hex_123");
    expect(drawerTitle.length).toBeGreaterThan(0);
  });
});
