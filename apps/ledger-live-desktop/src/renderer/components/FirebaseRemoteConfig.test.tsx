import React from "react";

const fetchAndActivate = jest.fn().mockResolvedValue(true);
const getValueMock = jest.fn().mockReturnValue("");
const getAllMock = jest.fn().mockReturnValue({});

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
  deleteApp: jest.fn(),
}));

jest.mock("firebase/remote-config", () => ({
  getRemoteConfig: jest.fn(() => ({ settings: {}, defaultConfig: {} })),
  fetchAndActivate: (...args: unknown[]) => fetchAndActivate(...args),
  getValue: (...args: unknown[]) => getValueMock(...args),
  getAll: () => getAllMock(),
}));

jest.mock("~/firebase-setup", () => ({
  getFirebaseConfig: () => ({}),
}));

jest.mock("@ledgerhq/live-config/LiveConfig", () => ({
  LiveConfig: {
    setProvider: jest.fn(),
    instance: { config: {} },
    getDefaultValueByKey: jest.fn(),
  },
}));

jest.mock("@ledgerhq/live-config/providers/index", () => ({
  FirebaseRemoteConfigProvider: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  DEFAULT_FEATURES: {},
  formatDefaultFeatures: () => ({}),
}));

import { act, render } from "@testing-library/react";
import { FirebaseRemoteConfigProvider } from "./FirebaseRemoteConfig";

const FIVE_MINUTES = 5 * 60 * 1000;
const flushMicrotasks = () => act(async () => {});

describe("FirebaseRemoteConfigProvider", () => {
  beforeEach(() => {
    fetchAndActivate.mockClear();
    fetchAndActivate.mockResolvedValue(true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls fetchAndActivate once on mount and again on each 5-minute interval tick", async () => {
    render(
      <FirebaseRemoteConfigProvider>
        <div />
      </FirebaseRemoteConfigProvider>,
    );

    await flushMicrotasks();
    expect(fetchAndActivate).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(FIVE_MINUTES);
    });
    expect(fetchAndActivate).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(FIVE_MINUTES);
    });
    expect(fetchAndActivate).toHaveBeenCalledTimes(3);
  });

  it("keeps polling even when a fetch rejects", async () => {
    fetchAndActivate.mockRejectedValueOnce(new Error("network error"));
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <FirebaseRemoteConfigProvider>
        <div />
      </FirebaseRemoteConfigProvider>,
    );

    await flushMicrotasks();
    expect(fetchAndActivate).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(FIVE_MINUTES);
    });
    expect(fetchAndActivate).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });
});
