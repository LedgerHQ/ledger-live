import { act, renderHook } from "@tests/test-renderer";
import {
  setCountervalue,
  setDiscreetMode,
  setLanguage,
  setMevProtection,
  setTheme,
} from "~/actions/settings";
import { activateDrawerSelector } from "~/reducers/walletSync";
import type { AppLockAdapter } from "./sections/security/types";
import { useMobileSettingsPort } from "./useMobileSettingsPort";

const appLock = (overrides: Partial<AppLockAdapter> = {}): AppLockAdapter => ({
  passwordSet: false,
  biometricKind: null,
  biometricsEnabled: false,
  biometricsRequirePassword: false,
  requestAppLock: jest.fn(),
  setBiometricsEnabled: jest.fn(),
  ...overrides,
});

describe("useMobileSettingsPort", () => {
  it("reads the theme from the legacy store", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort(appLock()));

    act(() => {
      store.dispatch(setTheme("dark"));
    });

    expect(result.current.values.theme).toBe("dark");
  });

  it("stores a theme change", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort(appLock()));

    act(() => {
      result.current.setValue({ key: "theme", value: "light" });
    });

    expect(store.getState().settings.theme).toBe("light");
  });

  it("keeps the system theme as a value", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort(appLock()));

    act(() => {
      result.current.setValue({ key: "theme", value: "system" });
    });

    expect(store.getState().settings.theme).toBe("system");
    expect(result.current.values.theme).toBe("system");
  });

  it("reads and stores hide balance and MEV protection in the legacy store", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort(appLock()));

    act(() => {
      store.dispatch(setDiscreetMode(true));
      store.dispatch(setMevProtection(false));
    });
    expect(result.current.values.hideBalance).toBe(true);
    expect(result.current.values.mevProtection).toBe(false);

    act(() => {
      result.current.setValue({ key: "hideBalance", value: false });
      result.current.setValue({ key: "mevProtection", value: true });
    });
    expect(store.getState().settings.discreetMode).toBe(false);
    expect(store.getState().settings.mevProtection).toBe(true);
  });

  it("takes the App lock values from the adapter and sends its changes to it", () => {
    const lock = appLock({ passwordSet: true, biometricKind: "faceId", biometricsEnabled: true });
    const { result } = renderHook(() => useMobileSettingsPort(lock));

    expect(result.current.values).toMatchObject({
      passwordSet: true,
      biometricKind: "faceId",
      biometricsEnabled: true,
    });

    act(() => {
      result.current.setValue({ key: "biometricsEnabled", value: false });
      result.current.requestAppLock("remove");
    });

    expect(lock.setBiometricsEnabled).toHaveBeenCalledWith(false);
    expect(lock.requestAppLock).toHaveBeenCalledWith("remove");
  });

  it("reads the language and currency from the legacy store", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort(appLock()));

    act(() => {
      store.dispatch(setLanguage("fr"));
      store.dispatch(setCountervalue("EUR"));
    });

    expect(result.current.values).toMatchObject({
      language: "fr",
      currency: "EUR",
    });
  });

  it("stores a language change and ignores an unsupported language", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort(appLock()));

    act(() => {
      result.current.setValue({ key: "language", value: "fr" });
    });
    expect(store.getState().settings.language).toBe("fr");

    act(() => {
      result.current.setValue({ key: "language", value: "xx" });
    });
    expect(store.getState().settings.language).toBe("fr");
  });

  it("stores a currency change by the countervalue id, and ignores an unknown one", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort(appLock()));

    act(() => {
      result.current.setValue({ key: "currency", value: "BTC" });
    });
    expect(store.getState().settings.counterValue).toBe("bitcoin");

    act(() => {
      result.current.setValue({ key: "currency", value: "NOPE" });
    });
    expect(store.getState().settings.counterValue).toBe("bitcoin");
  });

  it("offers the supported languages and countervalues", () => {
    const { result } = renderHook(() => useMobileSettingsPort(appLock()));

    expect(result.current.languages).toContainEqual({
      value: "fr",
      label: "Français",
    });
    expect(result.current.currencies).toContainEqual({
      value: "BTC",
      label: "Bitcoin",
      description: "BTC",
    });
  });

  it("opens the Ledger Sync activation drawer while Ledger Sync is not active", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort(appLock()));

    expect(result.current.ledgerSync.isActive).toBe(false);
    act(() => {
      result.current.ledgerSync.open();
    });

    expect(activateDrawerSelector(store.getState())).toBe(true);
  });
});
