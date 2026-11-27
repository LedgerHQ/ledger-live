import React from "react";
import { track } from "@shared/analytics";
import { LinkingProvider } from "@shared/linking";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import SettingsNavigator from "~/components/RootNavigator/SettingsNavigator";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

const TWITTER_URL = "https://twitter.com/Ledger";
const INSTAGRAM_URL = "https://www.instagram.com/ledger/";
const GITHUB_URL = "https://github.com/LedgerHQ/ledger-live";
const LEGACY_ABOUT_CARD = "App information, terms and conditions, and privacy policy.";

const flags = (ratingsPrompt: boolean) =>
  withFlagOverrides({ newSettings: { enabled: true }, ratingsPrompt: { enabled: ratingsPrompt } });

async function openAbout({ ratingsPrompt = false } = {}) {
  const openExternal = jest.fn();
  const rendered = render(
    <LinkingProvider config={{ openExternal }}>
      <SettingsNavigator />
    </LinkingProvider>,
    { overrideInitialState: flags(ratingsPrompt) },
  );

  await rendered.user.press(await screen.findByTestId("settings-home-about"));
  expect(await screen.findByTestId("settings-about")).toBeVisible();

  return { ...rendered, openExternal };
}

const tracked = (event: string, payload: Record<string, unknown>) =>
  jest.mocked(track).mock.calls.some(([name, data]) => {
    const props: Record<string, unknown> = { ...data };
    return name === event && Object.entries(payload).every(([key, value]) => props[key] === value);
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Settings About section", () => {
  it("shows the version, the terms and the social links", async () => {
    await openAbout({ ratingsPrompt: true });

    expect(screen.getByTestId("settings-about-version")).toBeVisible();
    expect(screen.getByText("Terms and conditions")).toBeVisible();
    expect(screen.getByText("Connect with us")).toBeVisible();
    expect(screen.getByText("Rate us on App Store")).toBeVisible();
    expect(screen.getByText("Follow us on X")).toBeVisible();
    expect(screen.getByText("Follow us on Instagram")).toBeVisible();
    expect(screen.getByText("Review our Github")).toBeVisible();
  });

  it("hides the feedback and rate rows when the ratings prompt is off", async () => {
    await openAbout({ ratingsPrompt: false });

    expect(screen.queryByTestId("settings-about-feedback")).toBeNull();
    expect(screen.queryByTestId("settings-about-rate")).toBeNull();
  });

  it("opens the terms and the social links", async () => {
    const { user, openExternal } = await openAbout();

    await user.press(screen.getByTestId("settings-about-terms"));
    await user.press(screen.getByTestId("settings-about-x"));
    await user.press(screen.getByTestId("settings-about-instagram"));
    await user.press(screen.getByTestId("settings-about-github"));

    expect(openExternal.mock.calls).toEqual([
      [expect.stringContaining("ledger-live-terms-of-use")],
      [TWITTER_URL],
      [INSTAGRAM_URL],
      [GITHUB_URL],
    ]);
  });

  it("opens the App Store or Play Store page from the rate row", async () => {
    const { user, openExternal } = await openAbout({ ratingsPrompt: true });

    await user.press(screen.getByTestId("settings-about-rate"));

    expect(openExternal.mock.calls).toEqual([
      [expect.stringMatching(/apps\.apple\.com|play\.google\.com/)],
    ]);
  });

  it("tracks the terms row with the legacy event", async () => {
    const { user } = await openAbout();

    await user.press(screen.getByTestId("settings-about-terms"));

    expect(jest.mocked(track).mock.calls.map(([name]) => name)).toContain("TermsConditionsRow");
  });

  it("opens the ratings modal from the feedback row when the ratings prompt is on", async () => {
    const { user, store } = await openAbout({ ratingsPrompt: true });

    await user.press(screen.getByTestId("settings-about-feedback"));

    expect(store.getState().ratings.isRatingsModalOpen).toBe(true);
    expect(tracked("button_clicked", { button: "manual_review", source: "Settings" })).toBe(true);
  });

  it("unlocks the Debug menu on the fifth tap of the version, and not before", async () => {
    const { user, store } = await openAbout();
    const version = screen.getByTestId("settings-about-version");

    for (let tap = 0; tap < 4; tap++) await user.press(version);
    expect(store.getState().appstate.debugMenuVisible).toBe(false);

    await user.press(version);
    expect(store.getState().appstate.debugMenuVisible).toBe(true);
  });
});

describe("Settings About section with the flag off", () => {
  it("keeps the legacy Settings", async () => {
    render(
      <LinkingProvider config={{ openExternal: jest.fn() }}>
        <SettingsNavigator />
      </LinkingProvider>,
      {
        overrideInitialState: withFlagOverrides({ newSettings: { enabled: false } }),
      },
    );

    expect(await screen.findByText(LEGACY_ABOUT_CARD)).toBeVisible();
    expect(screen.queryByTestId("settings-home")).toBeNull();
  });
});
