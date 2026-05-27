import React from "react";

let resolveReady: (() => void) | null = null;
let readyPromise: Promise<void>;
const subscribeMock = jest.fn();
const unsubscribeMock = jest.fn();
const getRemoteConfigSingletonMock = jest.fn(() => ({
  settings: { minimumFetchIntervalMillis: 0 },
  defaultConfig: {} as Record<string, string>,
}));

const resetReady = () => {
  readyPromise = new Promise<void>(resolve => {
    resolveReady = resolve;
  });
};
resetReady();

jest.mock("~/firebase/remoteConfig", () => ({
  getRemoteConfigSingleton: () => getRemoteConfigSingletonMock(),
  subscribeToRemoteFlags: (cb: (e: { fetchedAt: number }) => void) => {
    subscribeMock(cb);
    return () => unsubscribeMock();
  },
  whenReady: () => readyPromise,
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
  deleteApp: jest.fn(),
}));

jest.mock("firebase/remote-config", () => ({
  getRemoteConfig: jest.fn(() => ({ settings: {}, defaultConfig: {} })),
  fetchAndActivate: jest.fn().mockResolvedValue(true),
  getValue: jest.fn().mockReturnValue(""),
  getAll: jest.fn().mockReturnValue({}),
}));

jest.mock("~/firebase-setup", () => ({
  getFirebaseConfig: () => ({}),
}));

const setProviderMock = jest.fn();
jest.mock("@ledgerhq/live-config/LiveConfig", () => ({
  LiveConfig: {
    setProvider: (...args: unknown[]) => setProviderMock(...args),
    instance: { config: {} },
    getDefaultValueByKey: jest.fn(),
  },
}));

jest.mock("@ledgerhq/live-config/providers/index", () => ({
  FirebaseRemoteConfigProvider: jest.fn().mockImplementation(() => ({})),
}));

import { act, render } from "@testing-library/react";
import { FirebaseRemoteConfigProvider } from "./FirebaseRemoteConfig";

const flushMicrotasks = () => act(async () => {});

describe("FirebaseRemoteConfigProvider", () => {
  beforeEach(() => {
    subscribeMock.mockClear();
    unsubscribeMock.mockClear();
    setProviderMock.mockClear();
    getRemoteConfigSingletonMock.mockClear();
    resetReady();
  });

  it("returns null until whenReady resolves", async () => {
    const { container } = render(
      <FirebaseRemoteConfigProvider>
        <div data-testid="child" />
      </FirebaseRemoteConfigProvider>,
    );

    expect(container.querySelector('[data-testid="child"]')).toBeNull();

    await act(async () => {
      resolveReady?.();
      await readyPromise;
    });

    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });

  it("installs the LiveConfig provider on mount", async () => {
    render(
      <FirebaseRemoteConfigProvider>
        <div />
      </FirebaseRemoteConfigProvider>,
    );

    await flushMicrotasks();
    expect(setProviderMock).toHaveBeenCalledTimes(1);
  });

  it("subscribes to remote-flag updates on mount and unsubscribes on unmount", async () => {
    const { unmount } = render(
      <FirebaseRemoteConfigProvider>
        <div />
      </FirebaseRemoteConfigProvider>,
    );

    await flushMicrotasks();
    expect(subscribeMock).toHaveBeenCalledTimes(1);

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it("renders children even when whenReady resolves after a failed first fetch", async () => {
    const { container } = render(
      <FirebaseRemoteConfigProvider>
        <div data-testid="child" />
      </FirebaseRemoteConfigProvider>,
    );

    expect(container.querySelector('[data-testid="child"]')).toBeNull();

    // Mirrors the production case where fetchRemoteFlags throws but whenReady
    // still resolves so the app boots without remote values.
    await act(async () => {
      resolveReady?.();
      await readyPromise;
    });

    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
