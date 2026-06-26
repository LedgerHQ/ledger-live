import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ScreenName } from "~/const";
import ViewKeyRejectedScreen from "./ViewKeyRejectedScreen";

// --- module mocks ---

jest.mock("@ledgerhq/native-ui", () => {
  const { View: V, Text: RNText } = require("react-native");
  return {
    __esModule: true,
    Flex: ({ children }: { children: React.ReactNode }) => <V>{children}</V>,
    Icons: {
      WarningFill: () => <V testID="icon-warning" />,
    },
    rgba: (color: string, _alpha: number) => color,
    Text: ({ children }: { children: React.ReactNode }) => <RNText>{children}</RNText>,
  };
});

jest.mock("styled-components/native", () => ({
  useTheme: jest.fn(() => ({
    colors: { warning: { c70: "#f0a500" } },
    space: { 10: 40 },
  })),
}));

jest.mock("~/context/Locale", () => ({
  Trans: ({ i18nKey, values }: { i18nKey: string; values?: Record<string, string> }) =>
    values ? `${i18nKey}:${JSON.stringify(values)}` : i18nKey,
  useTranslation: () => ({ t: (key: string) => key }),
}));

let capturedCategory: string | undefined;
jest.mock("~/analytics", () => ({
  TrackScreen: ({ category }: { category: string }) => {
    capturedCategory = category;
    return null;
  },
}));

jest.mock("~/components/SafeAreaView", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

jest.mock("~/components/Circle", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

let capturedOnClose: (() => void) | undefined;
jest.mock("LLM/components/CloseWithConfirmation", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return ({
    onClose,
    buttonText,
  }: {
    onClose?: () => void;
    buttonText?: string;
    showButton?: boolean;
  }) => {
    capturedOnClose = onClose;
    return (
      <TouchableOpacity testID="close-button" onPress={onClose}>
        <Text>{buttonText}</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock("LLM/features/Accounts/components/VerticalGradientBackground", () => {
  const { View } = require("react-native");
  return ({ stopColor }: { stopColor?: string }) => (
    <View testID="gradient-background" accessibilityLabel={stopColor} />
  );
});

// --- fixtures ---

const mockNavigation = {};

const makeMockRoute = (overrides: { onCloseNavigation?: () => void } = {}) => ({
  params: {
    currency: { type: "CryptoCurrency" as const, id: "aleo", name: "Aleo" },
    device: { modelId: "stax", deviceId: "test-device-id" },
    context: undefined,
    onCloseNavigation: overrides.onCloseNavigation,
  },
  name: ScreenName.AleoViewKeyRejected,
  key: "test-key",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderScreen = (routeOverrides: { onCloseNavigation?: () => void } = {}) =>
  render(
    <ViewKeyRejectedScreen
      route={makeMockRoute(routeOverrides) as any}
      navigation={mockNavigation as any}
    />,
  );

// --- tests ---

describe("ViewKeyRejectedScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedCategory = undefined;
    capturedOnClose = undefined;
  });

  it("tracks the screen with 'Cant add a new account' category", () => {
    renderScreen();
    expect(capturedCategory).toBe("Cant add a new account");
  });

  it("renders the gradient background", () => {
    renderScreen();
    expect(screen.getByTestId("gradient-background")).toBeTruthy();
  });

  it("renders the warning icon", () => {
    renderScreen();
    expect(screen.getByTestId("icon-warning")).toBeTruthy();
  });

  it("renders the title with the currency name interpolated", () => {
    renderScreen();
    expect(
      screen.getByText('aleo.addAccount.stepViewKeyRejected.title:{"currency":"Aleo"}'),
    ).toBeTruthy();
  });

  it("renders the description", () => {
    renderScreen();
    expect(
      screen.getByText("aleo.addAccount.stepViewKeyRejected.description"),
    ).toBeTruthy();
  });

  it("renders the close button with the ctaClose translation key", () => {
    renderScreen();
    expect(screen.getByText("addAccounts.addAccountsSuccess.ctaClose")).toBeTruthy();
  });

  describe("close button behaviour", () => {
    it("calls onCloseNavigation when provided", () => {
      const onCloseNavigation = jest.fn();
      renderScreen({ onCloseNavigation });

      fireEvent.press(screen.getByTestId("close-button"));

      expect(onCloseNavigation).toHaveBeenCalledTimes(1);
    });

    it("does nothing when onCloseNavigation is not provided", () => {
      renderScreen();

      fireEvent.press(screen.getByTestId("close-button"));
      // onCloseNavigation?.() is a no-op when undefined — button press doesn't crash
    });
  });
});
