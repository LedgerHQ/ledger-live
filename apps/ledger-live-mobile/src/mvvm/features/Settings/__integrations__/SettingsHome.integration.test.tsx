import React from "react";
import { trackPage } from "@shared/analytics";
import { render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import SettingsNavigator from "~/components/RootNavigator/SettingsNavigator";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

const HOME_SECTIONS = [
  "general",
  "assetManagement",
  "security",
  "notifications",
  "privacy",
  "about",
];
const LEGACY_GENERAL_CARD = "Configure general Ledger Wallet settings.";

// The jest mock of react-native-screens also renders the native header that the app hides
// behind the Lumen one, so the first match is the nav bar on screen.
const getNavBarTitle = () => screen.getAllByTestId("navigation-header-title")[0];

function renderSettings(isSettingsHomeEnabled: boolean) {
  return render(<SettingsNavigator />, {
    overrideInitialState: withFlagOverrides({ newSettings: { enabled: isSettingsHomeEnabled } }),
  });
}

describe("Settings home", () => {
  beforeEach(() => {
    jest.mocked(trackPage).mockClear();
  });

  it("keeps the legacy home when the flag is off", async () => {
    renderSettings(false);

    expect(await screen.findByText(LEGACY_GENERAL_CARD)).toBeVisible();
    expect(screen.queryByTestId("settings-home")).toBeNull();
  });

  it("tracks the legacy Settings page once when the flag is off", async () => {
    renderSettings(false);

    expect(await screen.findByText(LEGACY_GENERAL_CARD)).toBeVisible();
    const settingsPages = jest
      .mocked(trackPage)
      .mock.calls.filter(([page]) => page.category === "Settings");
    expect(settingsPages).toHaveLength(1);
  });

  it("shows one row per section when the flag is on", async () => {
    renderSettings(true);

    expect(await screen.findByTestId("settings-home")).toBeVisible();
    HOME_SECTIONS.forEach(section =>
      expect(screen.getByTestId(`settings-home-${section}`)).toBeVisible(),
    );
    expect(screen.queryByText(LEGACY_GENERAL_CARD)).toBeNull();
  });

  it("tracks the Settings page like the legacy home", async () => {
    renderSettings(true);

    expect(await screen.findByTestId("settings-home")).toBeVisible();
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Settings" }),
      expect.anything(),
    );
  });

  it("shows the Wallet 4.0 nav bar: Settings title and the Lumen back button", async () => {
    renderSettings(true);

    expect(await screen.findByTestId("settings-home")).toBeVisible();
    expect(getNavBarTitle()).toHaveTextContent("Settings");
    expect(screen.getByLabelText("Back")).toBeVisible();
  });

  it("opens the section screen of the pressed row, and back returns to the home", async () => {
    const { user } = renderSettings(true);

    await user.press(await screen.findByTestId("settings-home-general"));

    expect(await screen.findByTestId("settings-section-general")).toBeVisible();
    expect(getNavBarTitle()).toHaveTextContent("General");

    await user.press(screen.getAllByLabelText("Back").at(-1)!);

    await waitFor(() => expect(screen.queryByTestId("settings-section-general")).toBeNull());
    expect(screen.getByTestId("settings-home")).toBeVisible();
    expect(getNavBarTitle()).toHaveTextContent("Settings");
  });
});

describe("Settings home developer tools", () => {
  const isDevBuild = __DEV__;
  const setDevBuild = (value: boolean) =>
    Object.defineProperty(global, "__DEV__", { value, configurable: true });

  afterEach(() => {
    setDevBuild(isDevBuild);
  });

  function renderSettingsHome({ isDebugUnlocked }: Readonly<{ isDebugUnlocked: boolean }>) {
    return render(<SettingsNavigator />, {
      overrideInitialState: withFlagOverrides({ newSettings: { enabled: true } }, state => ({
        ...state,
        appstate: { ...state.appstate, debugMenuVisible: isDebugUnlocked },
      })),
    });
  }

  it("shows the Developer and Debug rows in a dev build", async () => {
    renderSettingsHome({ isDebugUnlocked: false });

    expect(await screen.findByTestId("settings-home-developer")).toBeVisible();
    expect(screen.getByTestId("settings-home-debug")).toBeVisible();
  });

  it("hides the Debug row in a release build until the debug menu is unlocked", async () => {
    setDevBuild(false);

    renderSettingsHome({ isDebugUnlocked: false });

    expect(await screen.findByTestId("settings-home-developer")).toBeVisible();
    expect(screen.queryByTestId("settings-home-debug")).toBeNull();
  });

  it("shows the Debug row in a release build once the debug menu is unlocked", async () => {
    setDevBuild(false);

    renderSettingsHome({ isDebugUnlocked: true });

    expect(await screen.findByTestId("settings-home-debug")).toBeVisible();
  });

  it("opens the Developer screen from its row", async () => {
    const { user } = renderSettingsHome({ isDebugUnlocked: false });

    await user.press(await screen.findByTestId("settings-home-developer"));

    expect(await screen.findByText("Custom CAL reference")).toBeVisible();
  });
});
