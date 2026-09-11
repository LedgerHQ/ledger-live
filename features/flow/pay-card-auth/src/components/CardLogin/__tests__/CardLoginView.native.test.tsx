import React from "react";
import { View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardLoginView } from "../CardLoginView.native";
import type { CardLoginIntroViewProps } from "../types";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
    <View testID={testID}>{children}</View>
  ),
}));

const intro: CardLoginIntroViewProps = {
  isOpen: false,
  title: "Spend crypto, earn cashback",
  providedBy: "Card provided by Baanx",
  rows: [],
  actions: [],
  onActionPress: jest.fn(),
  onClose: jest.fn(),
};

const defaultProps: React.ComponentProps<typeof CardLoginView> = {
  title: "Crypto Card",
  description: "Log in to access your card",
  loginLabel: "Login",
  alreadyHaveCardLabel: null,
  isLoading: false,
  errorMessage: null,
  onLoginPress: jest.fn(),
  onAlreadyHaveCardPress: jest.fn(),
  intro,
};

function renderCardLoginView(props: Partial<React.ComponentProps<typeof CardLoginView>> = {}) {
  return render(<CardLoginView {...defaultProps} {...props} />);
}

describe("CardLoginView (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the login action", () => {
    renderCardLoginView();

    expect(screen.getByText("Crypto Card")).toBeTruthy();
    expect(screen.getByText("Log in to access your card")).toBeTruthy();
    expect(screen.getByLabelText("Login")).toBeTruthy();
  });

  it("should render the copy it is handed, whichever it is", () => {
    renderCardLoginView({
      description: "Get 1% cashback every time you spend",
      loginLabel: "Get card",
    });

    expect(screen.getByText("Get 1% cashback every time you spend")).toBeTruthy();
    expect(screen.getByLabelText("Get card")).toBeTruthy();
  });

  it("should call the login handler when the action is pressed", () => {
    const onLoginPress = jest.fn();
    renderCardLoginView({ onLoginPress });

    fireEvent.press(screen.getByLabelText("Login"));

    expect(onLoginPress).toHaveBeenCalledTimes(1);
  });

  it("should render a login error when provided", () => {
    renderCardLoginView({ errorMessage: "Unable to start login. Please try again." });

    expect(screen.getByText("Unable to start login. Please try again.")).toBeTruthy();
  });

  it("should render no already-have-a-card action when no label is given", () => {
    renderCardLoginView();

    expect(screen.queryByLabelText("I already have a card")).toBeNull();
  });

  it("should call the already-have-a-card handler when that action is pressed", () => {
    const onAlreadyHaveCardPress = jest.fn();
    renderCardLoginView({
      alreadyHaveCardLabel: "I already have a card",
      onAlreadyHaveCardPress,
    });

    fireEvent.press(screen.getByLabelText("I already have a card"));

    expect(onAlreadyHaveCardPress).toHaveBeenCalledTimes(1);
  });
});
