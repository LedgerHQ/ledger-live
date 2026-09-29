import React from "react";
import { Pressable, Text, View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CardLoginView } from "../CardLoginView.native";
import type { CardAuthErrorCopy, CardLoginIntroViewProps } from "../types";

jest.mock("@shared/ui-info-state", () => ({
  InfoState: ({
    title,
    description,
    primaryCta,
    testID,
  }: {
    title: string;
    description: string;
    primaryCta: { label: string; onPress: () => void; testID: string };
    testID: string;
  }) => (
    <View testID={testID}>
      <Text>{title}</Text>
      <Text>{description}</Text>
      <Pressable testID={primaryCta.testID} onPress={primaryCta.onPress}>
        <Text>{primaryCta.label}</Text>
      </Pressable>
    </View>
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

function buildError(overrides: Partial<CardAuthErrorCopy> = {}): CardAuthErrorCopy {
  return {
    title: "Login could not start",
    description: "Please try again.",
    ctaLabel: "Try again",
    onRetry: jest.fn(),
    onDismiss: jest.fn(),
    ...overrides,
  };
}

const defaultProps: React.ComponentProps<typeof CardLoginView> = {
  title: "Crypto card",
  headline: "Get your crypto card",
  description: "Log in to access your card",
  loginLabel: "Login",
  isLoading: false,
  isResolving: false,
  error: null,
  onLoginPress: jest.fn(),
  intro,
};

function renderCardLoginView(props: Partial<React.ComponentProps<typeof CardLoginView>> = {}) {
  return render(<CardLoginView {...defaultProps} {...props} />);
}

function isSheetOpen() {
  return screen.getByTestId("card-auth-error-sheet").props.accessibilityState.expanded;
}

describe("CardLoginView (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the login action", () => {
    renderCardLoginView();

    expect(screen.getByText("Crypto card")).toBeVisible();
    expect(screen.getByText("Log in to access your card")).toBeVisible();
    expect(screen.getByLabelText("Login")).toBeVisible();
  });

  it("should render the copy it is handed, whichever it is", () => {
    renderCardLoginView({
      description: "Get 1% cashback every time you spend",
      loginLabel: "Get card",
    });

    expect(screen.getByText("Get 1% cashback every time you spend")).toBeVisible();
    expect(screen.getByLabelText("Get card")).toBeVisible();
  });

  it("should call the login handler when the action is pressed", () => {
    const onLoginPress = jest.fn();
    renderCardLoginView({ onLoginPress });

    fireEvent.press(screen.getByLabelText("Login"));

    expect(onLoginPress).toHaveBeenCalledTimes(1);
  });

  it("should keep the error sheet closed while there is no error", () => {
    renderCardLoginView();

    expect(isSheetOpen()).toBe(false);
  });

  it("should open the error sheet over the login block, and hide nothing", () => {
    renderCardLoginView({ error: buildError() });

    expect(isSheetOpen()).toBe(true);
    expect(screen.getByText("Login could not start")).toBeVisible();
    expect(screen.getByLabelText("Login")).toBeVisible();
  });

  it("should call onRetry when the sheet action is pressed", () => {
    const onRetry = jest.fn();
    renderCardLoginView({ error: buildError({ onRetry }) });

    fireEvent.press(screen.getByTestId("card-auth-error-cta"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should call onDismiss when the sheet is closed", () => {
    const onDismiss = jest.fn();
    renderCardLoginView({ error: buildError({ onDismiss }) });

    fireEvent.press(screen.getByTestId("card-auth-error-sheet-dismiss"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should show only the title of the login block while the session resolves", () => {
    renderCardLoginView({ isResolving: true });

    expect(screen.getByText("Crypto card")).toBeVisible();
    expect(screen.queryByText("Log in to access your card")).toBeNull();
    expect(screen.queryByLabelText("Login")).toBeNull();
  });
});
