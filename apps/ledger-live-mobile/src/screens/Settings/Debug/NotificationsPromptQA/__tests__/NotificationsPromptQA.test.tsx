import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen } from "@tests/test-renderer";
import DebugNotificationsPromptQA from "../index";
import { useNotificationsPromptQaViewModel } from "../useNotificationsPromptQaViewModel";
import { NOTIFICATIONS_QA_VERDICT_META } from "../utils";

jest.mock("../useNotificationsPromptQaViewModel", () => ({
  useNotificationsPromptQaViewModel: jest.fn(),
}));

jest.mock("~/analytics", () => ({
  TrackScreen: () => null,
}));

jest.mock("../../../SettingsNavigationScrollView", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
});

jest.mock("~/components/QueuedDrawer", () => {
  const { View, Pressable } = require("react-native");
  return {
    __esModule: true,
    default: (props: {
      isRequestingToBeOpened?: boolean;
      onBackdropPress?: () => void;
      children?: React.ReactNode;
    }) => {
      if (!props.isRequestingToBeOpened) return <View />;
      return (
        <View>
          <Pressable testID="drawer-backdrop" onPress={props.onBackdropPress} />
          {props.children}
        </View>
      );
    },
  };
});

jest.mock("LLM/features/NotificationsPrompt/screens/NotificationsPromptDrawerView", () => ({
  NotificationsPromptDrawerView: ({ onAllow }: { onAllow: () => void }) => {
    const { Pressable, Text } = require("react-native");
    return (
      <Pressable testID="qa-preview-allow" onPress={onAllow}>
        <Text>Preview allow</Text>
      </Pressable>
    );
  },
}));

const mockedViewModel = useNotificationsPromptQaViewModel as jest.Mock;

function renderScreen() {
  return render(<DebugNotificationsPromptQA />);
}

function buildViewModel(overrides: Record<string, unknown> = {}) {
  return {
    selectedSource: "onboarding",
    setSelectedSource: jest.fn(),
    isBaselineCaptured: true,
    verdict: "Show drawer",
    verdictMeta: NOTIFICATIONS_QA_VERDICT_META["Show drawer"],
    reason: "Eligible now",
    rawReason: "kind: show",
    resolvedPromptTarget: "globalPushNotifications",
    forceOpenDrawerLabel: "Force open globalPushNotifications drawer — bypass rules",
    decision: {
      kind: "show",
      source: "onboarding",
      delayMs: 0,
      drawerPromptTarget: "globalPushNotifications",
      dismissedCount: 0,
    },
    sourceLabel: "Onboarding",
    applyScenario: jest.fn(),
    onResetAll: jest.fn(),
    onTriggerProductionDrawer: jest.fn(),
    onForceOpenDrawer: jest.fn(),
    onMarkInactive: jest.fn(),
    onMarkRepromptable: jest.fn(),
    onKeepTwoDismissals: jest.fn(),
    userStateFields: [
      {
        label: "OS notification permission",
        value: "Not determined",
        raw: "permissionStatus: -1",
        status: { label: "Off", tone: "gray" },
      },
    ],
    decisionFields: [
      {
        label: "Drawer target",
        value: "globalPushNotifications",
        raw: "drawerPromptTarget: globalPushNotifications · dismissedCount: 0",
        status: { label: "Resolved", tone: "success" },
      },
    ],
    featureFields: [
      {
        label: "Braze notifications prompt",
        value: "Enabled",
        raw: "feature: brazePushNotifications",
        status: { label: "On", tone: "success" },
      },
    ],
    ...overrides,
  };
}

describe("DebugNotificationsPromptQA", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedViewModel.mockReturnValue(buildViewModel());
  });

  it("should show the headline verdict and force-open the resolved target", () => {
    const onForceOpenDrawer = jest.fn();
    mockedViewModel.mockReturnValue(buildViewModel({ onForceOpenDrawer }));

    renderScreen();

    expect(screen.getByText("NOTIFICATIONS PROMPT — QA")).toBeVisible();
    expect(screen.getAllByText("Show drawer").length).toBeGreaterThan(0);
    expect(screen.getByText("Eligible now")).toBeVisible();
    expect(
      screen.getByText("Force open globalPushNotifications drawer — bypass rules"),
    ).toBeVisible();

    fireEvent.press(screen.getByText("Force open globalPushNotifications drawer — bypass rules"));
    expect(onForceOpenDrawer).toHaveBeenCalled();
  });

  it("should apply a named scenario after confirm", () => {
    const applyScenario = jest.fn();
    mockedViewModel.mockReturnValue(buildViewModel({ applyScenario }));
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      const apply = buttons?.find(button => button.text === "Apply");
      apply?.onPress?.();
    });

    renderScreen();

    fireEvent.press(screen.getByLabelText("Apply First prompt scenario"));
    expect(applyScenario).toHaveBeenCalledWith(expect.objectContaining({ id: "first-prompt" }));
  });

  it("should show inspector fields on the Inspect tab", () => {
    renderScreen();

    fireEvent.press(screen.getByText("Inspect"));

    expect(screen.getByText("Current user and device state")).toBeVisible();
    expect(
      screen.getByText("drawerPromptTarget: globalPushNotifications · dismissedCount: 0"),
    ).toBeVisible();
    expect(screen.getByText("feature: brazePushNotifications")).toBeVisible();
  });

  it("should preview the drawer without calling production handlers", () => {
    const onForceOpenDrawer = jest.fn();
    mockedViewModel.mockReturnValue(buildViewModel({ onForceOpenDrawer }));

    renderScreen();

    fireEvent.press(screen.getByText("Preview drawer"));
    expect(screen.getByTestId("qa-preview-allow")).toBeVisible();

    fireEvent.press(screen.getByTestId("qa-preview-allow"));
    expect(screen.queryByTestId("qa-preview-allow")).toBeNull();
    expect(onForceOpenDrawer).not.toHaveBeenCalled();
  });

  it("should reset after confirm when a baseline was captured", () => {
    const onResetAll = jest.fn();
    mockedViewModel.mockReturnValue(buildViewModel({ onResetAll, isBaselineCaptured: true }));
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      const reset = buttons?.find(button => button.text === "Reset");
      reset?.onPress?.();
    });

    renderScreen();

    fireEvent.press(screen.getByText("Reset all"));
    expect(onResetAll).toHaveBeenCalled();
  });
});
