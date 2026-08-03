import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import VoteDelegationStarted from "./01-Started";
import { ScreenName } from "~/const";
import { Linking } from "react-native";
import { urls } from "~/utils/urls";

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const mockRoute = {
  params: {
    accountId: "account-id",
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => mockRoute,
  useIsFocused: () => true,
  useTheme: () => ({ colors: { background: "white", border: "black" } }),
}));

jest.mock("~/components/NavigationScrollView", () => {
  const { ScrollView } = require("react-native");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (props: any) => <ScrollView {...props}>{props.children}</ScrollView>;
});

describe("VoteDelegationStarted", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly and display expected elements", () => {
    render(<VoteDelegationStarted navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByTestId("cardano-vote-delegation-drep-button")).toBeDefined();
    expect(screen.getByTestId("cardano-vote-delegation-no-confidence-button")).toBeDefined();
    expect(screen.getByTestId("cardano-vote-delegation-abstain-button")).toBeDefined();
  });

  it("should open linking URL when 'How delegation works' is pressed", () => {
    const spy = jest.spyOn(Linking, "openURL").mockImplementation(jest.fn());
    render(<VoteDelegationStarted navigation={mockNavigation} route={mockRoute} />);

    const link = screen.getByText("How delegation works");
    fireEvent.press(link);
    expect(spy).toHaveBeenCalledWith(urls.cardanoStaking);
    spy.mockRestore();
  });

  it("should navigate to SelectDRep when 'DRep' is selected", () => {
    render(<VoteDelegationStarted navigation={mockNavigation} route={mockRoute} />);

    const drepBtn = screen.getByTestId("cardano-vote-delegation-drep-button");
    fireEvent.press(drepBtn);

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.CardanoVoteDelegationSelectDRep, {
      ...mockRoute.params,
    });
  });

  it("should navigate to Summary when 'Always no confidence' is selected", () => {
    render(<VoteDelegationStarted navigation={mockNavigation} route={mockRoute} />);

    const noConfBtn = screen.getByTestId("cardano-vote-delegation-no-confidence-button");
    fireEvent.press(noConfBtn);

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.CardanoVoteDelegationSummary, {
      ...mockRoute.params,
      option: "noConfidence",
      drep: undefined,
    });
  });

  it("should navigate to Summary when 'Always abstain' is selected", () => {
    render(<VoteDelegationStarted navigation={mockNavigation} route={mockRoute} />);

    const abstainBtn = screen.getByTestId("cardano-vote-delegation-abstain-button");
    fireEvent.press(abstainBtn);

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.CardanoVoteDelegationSummary, {
      ...mockRoute.params,
      option: "abstain",
      drep: undefined,
    });
  });
});
