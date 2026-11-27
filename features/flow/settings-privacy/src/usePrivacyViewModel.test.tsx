import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { track } from "@shared/analytics";
import { SettingsPortProvider } from "@features/flow-settings";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { createFakePrivacyPort } from "./__tests__/fakePrivacyPort";
import type { PrivacySettingsValues } from "./types";
import { PRIVACY_URLS } from "./urls";
import { usePrivacyViewModel } from "./usePrivacyViewModel";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

function renderViewModel(initial?: Partial<PrivacySettingsValues>) {
  const fake = createFakePrivacyPort(initial);
  const { openExternal, LinkingWrapper } = createFakeLinking();
  const hook = renderHook(() => usePrivacyViewModel({ testID: "settings-privacy" }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nWrapper>
        <LinkingWrapper>
          <SettingsPortProvider value={fake.port}>{children}</SettingsPortProvider>
        </LinkingWrapper>
      </I18nWrapper>
    ),
  });
  const row = (id: string) => hook.result.current.rows.find(candidate => candidate.id === id);
  const toggle = (id: string, value: boolean) =>
    act(() => {
      const trailing = row(id)?.trailing;
      if (trailing?.type === "toggle") trailing.onToggle(value);
    });
  return { ...fake, ...hook, openExternal, row, toggle };
}

describe("usePrivacyViewModel", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("lists the rows with their wording and a test id", () => {
    const { result } = renderViewModel();

    expect(result.current.testID).toBe("settings-privacy");
    expect(result.current.rows.map(({ id, title, testID }) => ({ id, title, testID }))).toEqual([
      { id: "bugReports", title: "Bug reports", testID: "setting-bugReports" },
      { id: "appPerformance", title: "App performance", testID: "setting-appPerformance" },
      {
        id: "personalizedExperience",
        title: "Personalized experience",
        testID: "setting-personalizedExperience",
      },
      { id: "privacyPolicy", title: "Privacy policy", testID: "setting-privacyPolicy" },
    ]);
  });

  it("reflects the current consents in the toggles", () => {
    const { row } = renderViewModel({
      bugReports: false,
      analytics: true,
      personalizedRecommendations: false,
    });

    expect(row("bugReports")?.trailing).toMatchObject({ type: "toggle", value: false });
    expect(row("appPerformance")?.trailing).toMatchObject({ type: "toggle", value: true });
    expect(row("personalizedExperience")?.trailing).toMatchObject({ type: "toggle", value: false });
  });

  it("changes bug reports without a toggle event", () => {
    const { toggle, updates } = renderViewModel({ bugReports: true });

    toggle("bugReports", false);

    expect(updates).toEqual([{ key: "bugReports", value: false }]);
    expect(track).not.toHaveBeenCalled();
  });

  it("changes app performance and tracks the desktop Analytics toggle", () => {
    const { toggle, updates } = renderViewModel();

    toggle("appPerformance", true);

    expect(updates).toEqual([{ key: "analytics", value: true }]);
    expect(track).toHaveBeenCalledWith(
      "toggle_clicked",
      { toggle: "Analytics", enabled: true, page: "settings general" },
      { mandatory: true },
    );
  });

  it("changes personalized recommendations and tracks their desktop toggle", () => {
    const { toggle, updates } = renderViewModel();

    toggle("personalizedExperience", true);

    expect(updates).toEqual([{ key: "personalizedRecommendations", value: true }]);
    expect(track).toHaveBeenCalledWith(
      "toggle_clicked",
      { toggle: "personalised recommendations", enabled: true, page: "settings general" },
      { mandatory: true },
    );
  });

  it("changes both consents from the Analytics toggle when they are not separate", () => {
    const { result, toggle, updates } = renderViewModel({ separateAnalyticsConsents: false });

    expect(result.current.rows.map(({ id }) => id)).toEqual([
      "bugReports",
      "analytics",
      "privacyPolicy",
    ]);
    toggle("analytics", true);

    expect(updates).toEqual([{ key: "analyticsAndRecommendations", value: true }]);
    expect(track).not.toHaveBeenCalled();
  });

  it("opens the desktop privacy policy as an external link", () => {
    const { row, openExternal } = renderViewModel();

    const trailing = row("privacyPolicy")?.trailing;
    if (trailing?.type === "externalLink") trailing.onSelect();

    expect(trailing?.type).toBe("externalLink");
    expect(openExternal.mock.calls).toEqual([[PRIVACY_URLS.privacyPolicy.desktop]]);
  });

  it("names the desktop state events", () => {
    const { result } = renderViewModel({ bugReports: true, separateAnalyticsConsents: false });

    expect(result.current.stateEvents).toEqual([
      { id: "bugReports", event: "ReportBugsEnabled" },
      { id: "analytics", event: "AnalyticsDisabled", mandatory: true },
    ]);
  });
});
