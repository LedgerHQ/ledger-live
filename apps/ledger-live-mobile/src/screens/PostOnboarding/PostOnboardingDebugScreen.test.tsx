import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { useDispatch, useSelector } from "~/context/hooks";
import PostOnboardingDebugScreen from "./PostOnboardingDebugScreen";

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockNavigateToPostOnboardingHub = jest.fn();
const mockSetStoreValue = jest.fn();
const mockStartPostOnboarding = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  useStartPostOnboardingCallback: () => mockStartPostOnboarding,
}));

jest.mock("@ledgerhq/live-common/postOnboarding/actions", () => ({
  removePostOnboardingActionCompleted: ({ actionId }: { actionId: string }) => ({
    type: "POST_ONBOARDING_REMOVE_ACTION_COMPLETED",
    payload: { actionId },
  }),
  setPostOnboardingDate: ({ onboardingDate }: { onboardingDate: Date | null }) => ({
    type: "POST_ONBOARDING_SET_ONBOARDING_DATE",
    payload: { onboardingDate },
  }),
}));

jest.mock("~/components/SafeAreaView", () => {
  const { View } = require("react-native");

  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

jest.mock("~/components/SettingsRow", () => {
  const { Text } = require("react-native");

  return ({ title, desc, onPress }: { title: string; desc?: string; onPress?: () => void }) => (
    <Text accessibilityRole="button" onPress={onPress}>
      {title}
      {desc ? ` ${desc}` : ""}
    </Text>
  );
});

jest.mock("~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback", () => ({
  useNavigateToPostOnboardingHubCallback: () => mockNavigateToPostOnboardingHub,
}));

jest.mock("~/logic/postOnboarding/usePostOnboardingHubCompletionContext", () => ({
  usePostOnboardingHubCompletionContext: () => ({ protectId: "protect-id" }),
}));

jest.mock("~/store", () => ({
  setStoreValue: (...args: unknown[]) => mockSetStoreValue(...args),
}));

jest.mock("~/context/hooks");

const mockedUseDispatch = jest.mocked(useDispatch);
const mockedUseSelector = jest.mocked(useSelector);

const now = new Date("2026-01-02T03:04:05.000Z");

describe("PostOnboardingDebugScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    jest.clearAllMocks();
    mockedUseDispatch.mockReturnValue(mockDispatch);
    mockedUseSelector.mockImplementation((selector: unknown) => {
      if (selector === onboardingDateSelector) return null;
      return undefined;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should show a null onboarding date when no date is persisted", () => {
    render(<PostOnboardingDebugScreen />);

    expect(screen.getByText(/Current: null/)).toBeTruthy();
  });

  it("should show the current onboarding date when one is persisted", () => {
    const persistedDate = new Date("2024-03-04T05:06:07.000Z");
    mockedUseSelector.mockImplementation((selector: unknown) => {
      if (selector === onboardingDateSelector) return persistedDate;
      return undefined;
    });

    render(<PostOnboardingDebugScreen />);

    expect(screen.getByText(/Current: 2024-03-04T05:06:07.000Z/)).toBeTruthy();
  });

  it("should set and reset the onboarding date from the debug actions", () => {
    render(<PostOnboardingDebugScreen />);

    fireEvent.press(screen.getByText(/onboardingDate - Set to today/));
    expect(mockDispatch).toHaveBeenCalledWith(setPostOnboardingDate({ onboardingDate: now }));

    fireEvent.press(screen.getByText(/onboardingDate - Reset to null/));
    expect(mockDispatch).toHaveBeenCalledWith(setPostOnboardingDate({ onboardingDate: null }));
  });
});
