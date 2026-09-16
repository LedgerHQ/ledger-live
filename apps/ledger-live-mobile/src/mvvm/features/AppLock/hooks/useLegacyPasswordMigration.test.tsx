import { act, render, waitFor, withFlagOverrides } from "@tests/test-renderer";
import React from "react";
import type { State } from "~/reducers/types";
import { useLegacyPasswordMigration } from "./useLegacyPasswordMigration";

jest.mock("@features/platform-app-lock", () => ({
  ...jest.requireActual("@features/platform-app-lock"),
  migrateLegacyPassword: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(7)),
}));

const { migrateLegacyPassword } = jest.requireMock("@features/platform-app-lock");

function Probe() {
  useLegacyPasswordMigration();
  return null;
}

const legacyUser = (overrides: Partial<{ hasPassword: boolean; isLocked: boolean }> = {}) => {
  const { hasPassword = true, isLocked = false } = overrides;

  return withFlagOverrides({ lwmPasswordRevamp: { enabled: true } }, (state: State) => ({
    ...state,
    appLock: { ...state.appLock, isHydrated: true, hasPassword: false },
    auth: { ...state.auth, isLocked },
    settings: { ...state.settings, privacy: { hasPassword, biometricsEnabled: false } },
  }));
};

beforeEach(() => jest.clearAllMocks());

describe("migrating a legacy password", () => {
  it("runs once the legacy lock has opened, and retires it", async () => {
    migrateLegacyPassword.mockResolvedValue({ status: "migrated", needsLongerPassword: false });

    const { store } = render(<Probe />, { overrideInitialState: legacyUser() });

    await waitFor(() => expect(migrateLegacyPassword).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(store.getState().appLock.hasPassword).toBe(true));

    // The whole point: one lock, not two. `AuthPass` locks on this flag and would otherwise keep
    // demanding the old password in front of the new unlock screen.
    expect(store.getState().settings.privacy?.hasPassword).toBeFalsy();
  });

  it("waits while the legacy lock still holds, when the password is not yet in hand", async () => {
    migrateLegacyPassword.mockResolvedValue({ status: "migrated", needsLongerPassword: false });

    render(<Probe />, { overrideInitialState: legacyUser({ isLocked: true }) });

    await act(async () => {});

    expect(migrateLegacyPassword).not.toHaveBeenCalled();
  });

  it("does not run for a user who never had a legacy password", async () => {
    render(<Probe />, { overrideInitialState: legacyUser({ hasPassword: false }) });

    await act(async () => {});

    expect(migrateLegacyPassword).not.toHaveBeenCalled();
  });

  it("records a short password, which nothing could tell once the plaintext is gone", async () => {
    migrateLegacyPassword.mockResolvedValue({ status: "migrated", needsLongerPassword: true });

    const { store } = render(<Probe />, { overrideInitialState: legacyUser() });

    await waitFor(() => expect(store.getState().appLock.needsLongerPassword).toBe(true));
  });

  it("keeps the legacy lock when the migration defers, so the user still has a way in", async () => {
    migrateLegacyPassword.mockResolvedValue({ status: "deferred" });

    const { store } = render(<Probe />, { overrideInitialState: legacyUser() });

    await waitFor(() => expect(migrateLegacyPassword).toHaveBeenCalled());

    expect(store.getState().settings.privacy?.hasPassword).toBe(true);
    expect(store.getState().appLock.hasPassword).toBe(false);
  });

  it("leaves both locks alone when the migration throws", async () => {
    migrateLegacyPassword.mockRejectedValue(new Error("keychain unavailable"));

    const { store } = render(<Probe />, { overrideInitialState: legacyUser() });

    await waitFor(() => expect(migrateLegacyPassword).toHaveBeenCalled());

    expect(store.getState().settings.privacy?.hasPassword).toBe(true);
    expect(store.getState().appLock.hasPassword).toBe(false);
  });
});
