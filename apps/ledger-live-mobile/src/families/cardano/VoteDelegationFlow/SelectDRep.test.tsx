import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import SelectDRep from "./SelectDRep";
import { ScreenName } from "~/const";
import { useCardanoFamilyDReps } from "@ledgerhq/live-common/families/cardano/react";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

// Mock the hook
jest.mock("@ledgerhq/live-common/families/cardano/react", () => ({
  useCardanoFamilyDReps: jest.fn(),
}));

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockRoute = {
  params: {
    accountId: "account-id",
    skipStartedStep: true,
  },
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("SelectDRep", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search input and call setSearchQuery when typing", () => {
    (useAccountScreen as jest.Mock).mockReturnValue({ account: { type: "Account", currency: { id: "cardano" } } });

    const mockSetSearchQuery = jest.fn();
    (useCardanoFamilyDReps as jest.Mock).mockReturnValue({
      dReps: [],
      searchQuery: "",
      setSearchQuery: mockSetSearchQuery,
      onScrollEndReached: jest.fn(),
      isPaginating: false,
    });

    render(<SelectDRep navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [
            {
              id: "account-id",
              type: "Account",
// eslint-disable-next-line @typescript-eslint/no-explicit-any
              currency: { id: "cardano" } as any,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          ],
        },
      }),
    });

    const searchInput = screen.getByPlaceholderText("Search by name or DRep Id...");
    expect(searchInput).toBeDefined();

    fireEvent.changeText(searchInput, "new query");
    expect(mockSetSearchQuery).toHaveBeenCalledWith("new query");
  });

  it("should navigate to Summary on DRep selection", () => {
    (useAccountScreen as jest.Mock).mockReturnValue({ account: { type: "Account", currency: { id: "cardano" } } });

    const mockDRep = { hex: "drep_hex_123", meta: { givenName: "DRep Name" } };
    (useCardanoFamilyDReps as jest.Mock).mockReturnValue({
      dReps: [mockDRep],
      searchQuery: "",
      setSearchQuery: jest.fn(),
      onScrollEndReached: jest.fn(),
      isPaginating: false,
    });

    render(<SelectDRep navigation={mockNavigation} route={mockRoute} />, {
      overrideInitialState: state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: [
            {
              id: "account-id",
              type: "Account",
// eslint-disable-next-line @typescript-eslint/no-explicit-any
              currency: { id: "cardano" } as any,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          ],
        },
      }),
    });

    // Tap on the DRep row
    const drepRow = screen.getByText("DRep Name");
    fireEvent.press(drepRow);

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.CardanoVoteDelegationSummary, {
      ...mockRoute.params,
      drep: mockDRep,
    });
  });
});
