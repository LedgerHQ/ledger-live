import { act, renderHook } from "tests/testSetup";
import { setHasPassword } from "~/renderer/actions/application";
import {
  saveSettings,
  setAutoLockTimeout,
  setDiscreetMode,
  setMevProtection,
} from "~/renderer/actions/settings";
import { isModalOpened } from "~/renderer/reducers/modals";
import {
  autoLockTimeoutSelector,
  discreetModeSelector,
  mevProtectionSelector,
} from "~/renderer/reducers/settings";
import { walletSyncDrawerVisibilitySelector } from "~/renderer/reducers/walletSync";
import { useDesktopSettingsPort } from "./useDesktopSettingsPort";

function renderPort(settings: Parameters<typeof saveSettings>[0] = {}) {
  const hook = renderHook(() => useDesktopSettingsPort());
  act(() => {
    hook.store.dispatch(saveSettings(settings));
  });
  return hook;
}

describe("useDesktopSettingsPort", () => {
  it("reads the theme from the legacy store", () => {
    const { result } = renderPort({ theme: "dark" });

    expect(result.current.values.theme).toBe("dark");
  });

  it("reads the system theme when none is stored", () => {
    const { result } = renderPort({ theme: null });

    expect(result.current.values.theme).toBe("system");
  });

  it("stores a theme change and stores null for the system theme", () => {
    const { result, store } = renderPort();

    act(() => {
      result.current.setValue({ key: "theme", value: "light" });
    });
    expect(store.getState().settings.theme).toBe("light");

    act(() => {
      result.current.setValue({ key: "theme", value: "system" });
    });
    expect(store.getState().settings.theme).toBeNull();
  });

  it("re-reads the value after the store changes", () => {
    const { result, store } = renderPort({ theme: "light" });

    act(() => {
      store.dispatch(saveSettings({ theme: "dark" }));
    });

    expect(result.current.values.theme).toBe("dark");
  });

  it("reads the language, region and currency from the legacy store", () => {
    const { result } = renderPort({ language: "fr", locale: "fr-FR", counterValue: "EUR" });

    expect(result.current.values).toMatchObject({
      language: "fr",
      region: "fr-FR",
      currency: "EUR",
    });
  });

  it("stores a language change and ignores an unsupported language", () => {
    const { result, store } = renderPort({ language: "en" });

    act(() => {
      result.current.setValue({ key: "language", value: "fr" });
    });
    expect(store.getState().settings.language).toBe("fr");

    act(() => {
      result.current.setValue({ key: "language", value: "xx" });
    });
    expect(store.getState().settings.language).toBe("fr");
  });

  it("stores a region change and replaces a sanctioned region by en-US", () => {
    const { result, store } = renderPort();

    act(() => {
      result.current.setValue({ key: "region", value: "fr-FR" });
    });
    expect(store.getState().settings.locale).toBe("fr-FR");

    act(() => {
      result.current.setValue({ key: "region", value: "ru-RU" });
    });
    expect(store.getState().settings.locale).toBe("en-US");
  });

  it("stores a currency change by the countervalue id, and ignores an unknown one", () => {
    const { result, store } = renderPort({ counterValue: "USD" });

    act(() => {
      result.current.setValue({ key: "currency", value: "BTC" });
    });
    expect(store.getState().settings.counterValue).toBe("bitcoin");

    act(() => {
      result.current.setValue({ key: "currency", value: "NOPE" });
    });
    expect(store.getState().settings.counterValue).toBe("bitcoin");
  });

  it("offers the supported countervalues as currencies", () => {
    const { result } = renderPort();

    expect(result.current.currencies).toContainEqual({
      value: "BTC",
      label: "Bitcoin - BTC",
    });
  });

  it("offers every supported language", () => {
    const { result } = renderPort();

    expect(result.current.languages).toContainEqual({
      value: "fr",
      label: "Français",
    });
  });

  it("opens the Ledger Sync drawer when Ledger Sync is not active", () => {
    const { result, store } = renderPort();

    expect(result.current.ledgerSync.isActive).toBe(false);
    act(() => {
      result.current.ledgerSync.open();
    });

    expect(walletSyncDrawerVisibilitySelector(store.getState())).toBe(true);
  });
});

describe("useDesktopSettingsPort, Security section", () => {
  it("reads the Security values from the legacy store", () => {
    const { result } = renderPort({
      discreetMode: true,
      mevProtection: false,
      autoLockTimeout: 30,
    });

    expect(result.current.values).toMatchObject({
      hideBalance: true,
      mevProtection: false,
      autoLockTimeout: 30,
      passwordSet: false,
      biometricKind: null,
      biometricsEnabled: false,
      biometricsRequirePassword: false,
    });
  });

  it("reads whether a password is set from the application state", () => {
    const { result, store } = renderPort();

    act(() => {
      store.dispatch(setHasPassword(true));
    });

    expect(result.current.values.passwordSet).toBe(true);
  });

  it("keeps the General values next to the Security ones", () => {
    const { result } = renderPort({ theme: "dark", discreetMode: true });

    expect(result.current.values).toMatchObject({ theme: "dark", hideBalance: true });
  });

  it("stores a hide balance change as the legacy discreet mode", () => {
    const { result, store } = renderPort({ discreetMode: false });

    act(() => {
      result.current.setValue({ key: "hideBalance", value: true });
    });

    expect(discreetModeSelector(store.getState())).toBe(true);
  });

  it("stores a MEV protection change like the legacy toggle", () => {
    const { result, store } = renderPort({ mevProtection: true });

    act(() => {
      result.current.setValue({ key: "mevProtection", value: false });
    });

    expect(mevProtectionSelector(store.getState())).toBe(false);
  });

  it("stores an auto-lock timeout change", () => {
    const { result, store } = renderPort({ autoLockTimeout: 10 });

    act(() => {
      result.current.setValue({ key: "autoLockTimeout", value: -1 });
    });

    expect(autoLockTimeoutSelector(store.getState())).toBe(-1);
  });

  it("does not touch the theme when a Security setting changes", () => {
    const { result, store } = renderPort({ theme: "dark" });

    act(() => {
      result.current.setValue({ key: "hideBalance", value: true });
    });

    expect(store.getState().settings.theme).toBe("dark");
  });

  it("shows a change made elsewhere in the app, as the legacy screens make it", () => {
    const { result, store } = renderPort({ discreetMode: false, mevProtection: true });

    act(() => {
      store.dispatch(setDiscreetMode(true));
      store.dispatch(setMevProtection(false));
      store.dispatch(setAutoLockTimeout(60));
    });

    expect(result.current.values).toMatchObject({
      hideBalance: true,
      mevProtection: false,
      autoLockTimeout: 60,
    });
  });

  it.each([
    ["set", "MODAL_PASSWORD"],
    ["change", "MODAL_PASSWORD"],
    ["remove", "MODAL_DISABLE_PASSWORD"],
  ] as const)("opens the legacy password modal for %s", (action, modal) => {
    const { result, store } = renderPort();

    act(() => {
      result.current.requestAppLock(action);
    });

    expect(isModalOpened(store.getState(), modal)).toBe(true);
  });
});
