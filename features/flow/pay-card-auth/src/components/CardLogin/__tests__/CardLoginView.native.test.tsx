import React from "react";
import { View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardLoginView } from "../CardLoginView.native";
import type { CardLoginIntroViewProps } from "../types";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
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
  headline: "Get your crypto card",
  description: "Log in to access your card",
  loginLabel: "Login",
  isLoading: false,
  error: null,
  onLoginPress: jest.fn(),
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

  it("should replace the login block with the error panel", () => {
    renderCardLoginView({
      error: {
        title: "Login could not start",
        description: "Please try again.",
        ctaLabel: "Try again",
        onRetry: jest.fn(),
      },
    });

    expect(screen.getByText("Login could not start")).toBeTruthy();
    expect(screen.queryByLabelText("Login")).toBeNull();
  });
});
