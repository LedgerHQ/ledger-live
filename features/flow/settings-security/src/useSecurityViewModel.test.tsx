import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { track } from "@shared/analytics";
import { SettingsPortProvider } from "@features/flow-settings";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { createFakeLinking } from "./__tests__/fakeLinking";
import { createFakeSecurityPort } from "./__tests__/fakeSecurityPort";
import type { SecuritySettingsValues } from "./types";
import { SECURITY_URLS } from "./urls";
import { useSecurityViewModel } from "./useSecurityViewModel";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

function renderViewModel(initial?: Partial<SecuritySettingsValues>) {
  const fake = createFakeSecurityPort(initial);
  const { openExternal, LinkingWrapper } = createFakeLinking();
  const hook = renderHook(() => useSecurityViewModel({}), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nWrapper>
        <LinkingWrapper>
          <SettingsPortProvider value={fake.port}>{children}</SettingsPortProvider>
        </LinkingWrapper>
      </I18nWrapper>
    ),
  });
  const row = (id: string) => hook.result.current.rows.find(candidate => candidate.id === id);
  return { ...fake, ...hook, openExternal, row };
}

describe("useSecurityViewModel", () => {
  beforeEach(() => jest.mocked(track).mockClear());

  it("lists hide balance, App lock and MEV protection while no password is set", () => {
    const { result } = renderViewModel();

    expect(result.current.rows.map(row => row.id)).toEqual([
      "hideBalance",
      "appLock",
      "mevProtection",
    ]);
  });

  it("adds Change password and Auto-lock once a password is set", () => {
    const { result } = renderViewModel({ passwordSet: true });

    expect(result.current.rows.map(row => row.id)).toEqual([
      "hideBalance",
      "appLock",
      "changePassword",
      "autoLock",
      "mevProtection",
    ]);
  });

  it("reflects the current values in the toggles and the select", () => {
    const { row } = renderViewModel({
      hideBalance: true,
      mevProtection: true,
      passwordSet: true,
      autoLockTimeout: 30,
    });

    expect(row("hideBalance")?.trailing).toMatchObject({ type: "toggle", value: true });
    expect(row("appLock")?.trailing).toMatchObject({ type: "toggle", value: true });
    expect(row("mevProtection")?.trailing).toMatchObject({ type: "toggle", value: true });
    expect(row("autoLock")?.trailing).toMatchObject({ type: "select", value: "30" });
  });

  it("changes hide balance and tracks the discreet mode toggle", () => {
    const { row, updates } = renderViewModel();

    act(() => {
      const trailing = row("hideBalance")?.trailing;
      if (trailing?.type === "toggle") trailing.onToggle(true);
    });

    expect(updates).toEqual([{ key: "hideBalance", value: true }]);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Discreet mode",
      toggle: "ON",
    });
  });

  it("changes MEV protection and tracks it as a mandatory toggle", () => {
    const { row, updates } = renderViewModel({ mevProtection: true });

    act(() => {
      const trailing = row("mevProtection")?.trailing;
      if (trailing?.type === "toggle") trailing.onToggle(false);
    });

    expect(updates).toEqual([{ key: "mevProtection", value: false }]);
    expect(track).toHaveBeenCalledWith(
      "toggle_clicked",
      { toggleAction: "OFF", toggle: "MEV", page: "Page Settings General" },
      { mandatory: true },
    );
  });

  it("opens the MEV protection page from the link", () => {
    const { row, openExternal } = renderViewModel();

    row("mevProtection")?.descriptionLink?.onSelect();

    expect(openExternal.mock.calls).toEqual([[SECURITY_URLS.mevProtection]]);
  });

  it("asks the app to set the password when App lock is turned on", () => {
    const { row, requestAppLock } = renderViewModel({ passwordSet: false });

    const trailing = row("appLock")?.trailing;
    if (trailing?.type === "toggle") trailing.onToggle(true);

    expect(requestAppLock.mock.calls).toEqual([["set"]]);
  });

  it("asks the app to remove the password when App lock is turned off", () => {
    const { row, requestAppLock } = renderViewModel({ passwordSet: true });

    const trailing = row("appLock")?.trailing;
    if (trailing?.type === "toggle") trailing.onToggle(false);

    expect(requestAppLock.mock.calls).toEqual([["remove"]]);
  });

  it("asks the app to change the password from the Change password button", () => {
    const { row, requestAppLock } = renderViewModel({ passwordSet: true });

    const trailing = row("changePassword")?.trailing;
    if (trailing?.type === "button") trailing.onSelect();

    expect(requestAppLock.mock.calls).toEqual([["change"]]);
  });

  it("changes the auto-lock timeout and ignores a value that is not an option", () => {
    const { row, updates } = renderViewModel({ passwordSet: true });

    const trailing = row("autoLock")?.trailing;
    if (trailing?.type === "select") {
      trailing.onSelectOption("60");
      trailing.onSelectOption("7");
    }

    expect(updates).toEqual([{ key: "autoLockTimeout", value: 60 }]);
  });

  it("names the state events after the password and MEV protection states", () => {
    const { result } = renderViewModel({ passwordSet: true, mevProtection: false });

    expect(result.current.stateEvents).toEqual([
      { id: "appLock", event: "PasswordEnabled" },
      { id: "mevProtection", event: "mev_disactivated" },
    ]);
  });
});
