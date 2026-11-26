import { act, renderHook } from "@tests/test-renderer";
import { setDiscreetMode, setMevProtection, setTheme } from "~/actions/settings";
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
});
