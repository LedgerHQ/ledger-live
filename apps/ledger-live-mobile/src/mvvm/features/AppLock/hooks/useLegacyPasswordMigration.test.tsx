import { renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useLegacyPasswordMigration } from "./useLegacyPasswordMigration";

jest.mock("../adapters/migration", () => ({
  migrateLegacyPassword: jest.fn(),
}));

const { migrateLegacyPassword } = jest.requireMock("../adapters/migration");

const legacyUser =
  ({ isLocked, enabled = true }: Readonly<{ isLocked: boolean; enabled?: boolean }>) =>
  (state: State): State => {
    const flagged = withFlagOverrides({ lwmPasswordRevamp: { enabled } })(state);

    return {
      ...flagged,
      settings: { ...flagged.settings, privacy: { hasPassword: true, biometricsEnabled: false } },
      auth: { ...flagged.auth, isLocked },
    };
  };

beforeEach(() => jest.clearAllMocks());

describe("migrating a legacy password", () => {
  it("runs off a successful legacy unlock, not while the legacy lock still holds", async () => {
    migrateLegacyPassword.mockResolvedValue({ status: "migrated", needsLongerPassword: true });

    const { store } = renderHook(() => useLegacyPasswordMigration(), {
      overrideInitialState: legacyUser({ isLocked: false }),
    });

    await waitFor(() => expect(store.getState().appLock.hasPassword).toBe(true));

    expect(migrateLegacyPassword).toHaveBeenCalledTimes(1);
    expect(store.getState().appLock.needsLongerPassword).toBe(true);
    expect(store.getState().settings.privacy).toMatchObject({ hasPassword: false });
  });

  it("waits while the legacy lock is still up", async () => {
    migrateLegacyPassword.mockResolvedValue({ status: "migrated", needsLongerPassword: false });

    renderHook(() => useLegacyPasswordMigration(), {
      overrideInitialState: legacyUser({ isLocked: true }),
    });

    await waitFor(() => expect(migrateLegacyPassword).not.toHaveBeenCalled());
  });

  it("does nothing for a device the flag has not reached", async () => {
    migrateLegacyPassword.mockResolvedValue({ status: "migrated", needsLongerPassword: false });

    renderHook(() => useLegacyPasswordMigration(), {
      overrideInitialState: legacyUser({ isLocked: false, enabled: false }),
    });

    await waitFor(() => expect(migrateLegacyPassword).not.toHaveBeenCalled());
  });

  it("leaves the legacy password in place when migration defers", async () => {
    migrateLegacyPassword.mockResolvedValue({ status: "deferred" });

    const { store } = renderHook(() => useLegacyPasswordMigration(), {
      overrideInitialState: legacyUser({ isLocked: false }),
    });

    await waitFor(() => expect(migrateLegacyPassword).toHaveBeenCalledTimes(1));

    expect(store.getState().appLock.hasPassword).toBe(false);
    expect(store.getState().settings.privacy).toEqual({
      hasPassword: true,
      biometricsEnabled: false,
    });
  });
});
