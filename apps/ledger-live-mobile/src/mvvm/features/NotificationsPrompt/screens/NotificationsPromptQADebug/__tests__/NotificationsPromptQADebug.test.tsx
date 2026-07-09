import React from "react";
import { Linking } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithReactQuery as render, withFlagOverrides } from "@tests/test-renderer";
import { NotificationsPromptProvider } from "LLM/features/NotificationsPrompt";
import { ScreenName } from "~/const";
import {
  createNotificationsPromptFeatureFlags,
  transactionsAlertsDrawerPromptCategoryConfig,
} from "../../../testUtils";
import { NotificationsPromptQADebugView } from "../NotificationsPromptQADebugView";
import { useNotificationsPromptQADebugViewModel } from "../useNotificationsPromptQADebugViewModel";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  // The "Go verify" links reuse the same drawer-opening hooks as the real quick actions
  // (useOpenReceiveDrawer/useOpenSwap/useOpenStakeDrawer), which call useRoute() internally.
  useRoute: () => ({ key: "test", name: "DebugNotificationsPromptQA", params: undefined }),
}));

function NotificationsPromptQADebug() {
  return <NotificationsPromptQADebugView {...useNotificationsPromptQADebugViewModel()} />;
}

const renderDebugScreen = () =>
  render(
    <NotificationsPromptProvider>
      <NotificationsPromptQADebug />
    </NotificationsPromptProvider>,
    { overrideInitialState: withFlagOverrides(createNotificationsPromptFeatureFlags()) },
  );

describe("NotificationsPromptQADebug", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.spyOn(Linking, "openSettings").mockResolvedValue();
  });

  it("renders the after-action tab without crashing and shows a verdict", () => {
    const { getByText } = renderDebugScreen();
    expect(getByText(/Drawer would/i)).toBeTruthy();
  });

  it("switches to the inactivity tab and re-renders without crashing", () => {
    const { getByText } = renderDebugScreen();
    fireEvent.press(getByText("After inactivity"));
    expect(getByText(/Drawer would/i)).toBeTruthy();
  });

  it("switches the selected action source without crashing", () => {
    const { getAllByText, getByText } = renderDebugScreen();
    // "Receive" also appears in the static transaction-alerts breakdown, so scope to the chip.
    fireEvent.press(getAllByText("Receive")[0]);
    expect(getByText(/Drawer would/i)).toBeTruthy();
  });

  it("shows both prompt-target rows on the after-action tab, with only one marked live", () => {
    const { getByText, getAllByText } = render(
      <NotificationsPromptProvider>
        <NotificationsPromptQADebug />
      </NotificationsPromptProvider>,
      {
        overrideInitialState: withFlagOverrides(
          createNotificationsPromptFeatureFlags({
            notificationsCategories: [transactionsAlertsDrawerPromptCategoryConfig],
          }),
        ),
      },
    );
    expect(getByText("Global push opt-in")).toBeTruthy();
    expect(getByText("Transaction alerts")).toBeTruthy();
    // Not opted in to global push yet -> that target is the live one, tx alerts is hypothetical.
    expect(getAllByText("LIVE NOW")).toHaveLength(1);
    // Static per-source breakdown (drawerPromptActions: ["send", "receive"]), independent of selection.
    expect(getByText(/Per action, against the real configured drawerPromptActions/)).toBeTruthy();
    expect(getAllByText("Eligible")).toHaveLength(2); // send, receive
    expect(getAllByText("Not eligible")).toHaveLength(5); // onboarding, dapp_complete, swap, stake, add_favorite_coin
  });

  it("disables the production-rules trigger with a reason when the decision is a skip", () => {
    // createNotificationsPromptFeatureFlags shares its action_events object across calls —
    // clone before mutating so this doesn't leak into other tests in this file.
    const flags = structuredClone(createNotificationsPromptFeatureFlags());
    flags.brazePushNotifications.params.action_events.send.enabled = false;
    const { getByText } = render(
      <NotificationsPromptProvider>
        <NotificationsPromptQADebug />
      </NotificationsPromptProvider>,
      { overrideInitialState: withFlagOverrides(flags) },
    );

    expect(getByText(/^Disabled — /)).toBeTruthy();
  });

  it("enables the production-rules trigger with a target-aware label when the decision shows", () => {
    const { getByText } = renderDebugScreen();
    expect(getByText(/Trigger via production rules → opens .* \(real analytics\)/)).toBeTruthy();
  });

  it("navigates to the real Notifications settings screen when editing app notifications", () => {
    const { getByText, getAllByText } = renderDebugScreen();
    fireEvent.press(getByText("Config & status"));
    fireEvent.press(getAllByText("Edit")[0]);
    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.NotificationsSettings);
  });

  it("opens the OS settings app when editing OS permission status", () => {
    const { getByText } = renderDebugScreen();
    fireEvent.press(getByText("Config & status"));
    fireEvent.press(getByText("Open OS settings"));
    expect(Linking.openSettings).toHaveBeenCalled();
  });
});
