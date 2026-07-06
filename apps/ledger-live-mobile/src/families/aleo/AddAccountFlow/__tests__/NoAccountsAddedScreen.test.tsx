import React from "react";
import { screen, render, fireEvent } from "@tests/test-renderer";
import NoAccountsAddedScreen from "../NoAccountsAddedScreen";
import { aleoCurrency } from "../../__mocks__/currency.mock";

let capturedCategory: string | undefined;
let capturedName: string | undefined;
jest.mock("~/analytics", () => ({
  TrackScreen: ({ category, name }: { category: string; name?: string }) => {
    capturedCategory = category;
    capturedName = name;
    return null;
  },
}));

jest.mock("LLM/components/CloseWithConfirmation", () => {
  const { TouchableOpacity, Text } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return function MockCloseWithConfirmation({
    onClose,
    buttonText,
  }: {
    onClose?: () => void;
    buttonText?: string;
  }) {
    return (
      <TouchableOpacity testID="close-button" onPress={onClose}>
        <Text>{buttonText}</Text>
      </TouchableOpacity>
    );
  };
});

const makeMockRoute = (overrides: { onCloseNavigation?: () => void } = {}) => ({
  params: {
    currency: aleoCurrency,
    device: { deviceId: "device-1", modelId: "nanoX", wired: false },
    context: undefined,
    onCloseNavigation: overrides.onCloseNavigation,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderScreen = (routeOverrides: { onCloseNavigation?: () => void } = {}) =>
  render(
    <NoAccountsAddedScreen route={makeMockRoute(routeOverrides) as any} navigation={{} as any} />,
  );

describe("NoAccountsAddedScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedCategory = undefined;
    capturedName = undefined;
  });

  it("tracks the screen with the AleoAddAccountFlow category and 'No accounts added' name", () => {
    renderScreen();
    expect(capturedCategory).toBe("AleoAddAccountFlow");
    expect(capturedName).toBe("No accounts added");
  });

  it("renders the title with the currency name interpolated", () => {
    renderScreen();
    expect(screen.getByText("No Aleo accounts were added")).toBeOnTheScreen();
  });

  it("renders the description", () => {
    renderScreen();
    expect(
      screen.getByText(
        "You haven't shared view keys for any of the selected accounts. View keys are required to display your private balance in Ledger Wallet.",
      ),
    ).toBeOnTheScreen();
  });

  it("renders the close button with the ctaClose translation", () => {
    renderScreen();
    expect(screen.getByText("Close")).toBeOnTheScreen();
  });

  it("calls onCloseNavigation when provided", () => {
    const onCloseNavigation = jest.fn();
    renderScreen({ onCloseNavigation });

    fireEvent.press(screen.getByTestId("close-button"));

    expect(onCloseNavigation).toHaveBeenCalledTimes(1);
  });

  it("does nothing when onCloseNavigation is not provided", () => {
    renderScreen();

    expect(() => fireEvent.press(screen.getByTestId("close-button"))).not.toThrow();
  });
});
