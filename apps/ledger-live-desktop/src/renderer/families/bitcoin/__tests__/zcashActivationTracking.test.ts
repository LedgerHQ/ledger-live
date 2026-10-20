import { createElement } from "react";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { render, renderHook } from "tests/testSetup";
import { track } from "@shared/analytics";
import type { Account } from "@ledgerhq/types-live";
import {
  getDurationBucket,
  getEnableFailureReason,
  markFirstSyncFailed,
  markPrivateBalanceEnabled,
  useZcashFirstSyncTracking,
  ZcashFirstSyncTracking,
} from "../zcashActivationTracking";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
}));
const mockedTrack = jest.mocked(track);

const MIN = 60_000;

const zcashAccount = (id: string, privateInfo: object): Account =>
  ({
    ...createFixtureAccount(),
    id,
    currency: { id: "zcash" },
    privateInfo,
  }) as unknown as Account;

// The pending map is module state: every test uses its own account id.
const mount = (accounts: Account[]) => {
  const result = renderHook(() => useZcashFirstSyncTracking(), {
    initialState: { accounts },
  });
  return result;
};

const named = (name: string, message = "detail that must not matter") => {
  const error = new Error(message);
  error.name = name;
  return error;
};

describe("getEnableFailureReason", () => {
  it.each([
    ["UserRefusedOnDevice", "user_refused"],
    ["DisconnectedDevice", "device_error"],
    ["DisconnectedDeviceDuringOperation", "device_error"],
    ["LockedDeviceError", "device_error"],
    ["CantOpenDevice", "device_error"],
    ["BluetoothRequired", "device_error"],
    ["TransportWebUSBGestureRequired", "device_error"],
    ["TransportInterfaceNotAvailable", "device_error"],
    ["PeerRemovedPairing", "device_error"],
    ["PairingFailed", "device_error"],
    ["TransportRaceCondition", "device_error"],
    ["WrongAppForCurrency", "app_error"],
    ["UpdateYourApp", "app_error"],
    ["FirmwareOrAppUpdateRequired", "app_error"],
    ["UnsupportedV6SourceTransaction", "app_error"],
    ["Error", "unknown"],
    ["SomethingElse", "unknown"],
  ])("maps %s to %s", (name, reason) => {
    expect(getEnableFailureReason(named(name))).toBe(reason);
  });

  it("reads the name only, never the message", () => {
    expect(getEnableFailureReason(named("Error", "UserRefusedOnDevice"))).toBe("unknown");
  });

  it.each([null, undefined, "UserRefusedOnDevice", 42, {}])("is unknown for %p", value => {
    expect(getEnableFailureReason(value)).toBe("unknown");
  });
});

describe("getDurationBucket", () => {
  const MIN = 60_000;
  it.each([
    [0, "under_5m"],
    [5 * MIN - 1, "under_5m"],
    [5 * MIN, "5m_30m"],
    [30 * MIN - 1, "5m_30m"],
    [30 * MIN, "30m_2h"],
    [120 * MIN - 1, "30m_2h"],
    [120 * MIN, "2h_6h"],
    [360 * MIN - 1, "2h_6h"],
    [360 * MIN, "over_6h"],
  ])("puts %d ms in %s", (ms, bucket) => {
    expect(getDurationBucket(ms)).toBe(bucket);
  });
});

describe("useZcashFirstSyncTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tracks completion once, with the duration bucket", () => {
    markPrivateBalanceEnabled("a1", Date.now() - 10 * MIN);
    mount([zcashAccount("a1", { syncState: "complete" })]);

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith("zcash_private_balance_first_sync_completed", {
      currency: "zcash",
      durationBucket: "5m_30m",
    });

    mount([zcashAccount("a1", { syncState: "complete" })]);
    expect(mockedTrack).toHaveBeenCalledTimes(1);
  });

  it("tracks a failure when stopped carries a sync error", () => {
    markPrivateBalanceEnabled("a2", Date.now() - 3 * 60 * MIN);
    mount([zcashAccount("a2", { syncState: "stopped", lastSyncError: "boom" })]);

    expect(mockedTrack).toHaveBeenCalledWith("zcash_private_balance_first_sync_failed", {
      currency: "zcash",
      durationBucket: "2h_6h",
      reason: "sync_error",
    });
    expect(JSON.stringify(mockedTrack.mock.calls)).not.toContain("boom");
  });

  it("keeps waiting on a user stop, then tracks completion", () => {
    markPrivateBalanceEnabled("a3");
    mount([zcashAccount("a3", { syncState: "stopped", lastSyncError: null })]);
    expect(mockedTrack).not.toHaveBeenCalled();

    mount([zcashAccount("a3", { syncState: "complete" })]);
    expect(mockedTrack).toHaveBeenCalledWith(
      "zcash_private_balance_first_sync_completed",
      expect.objectContaining({ currency: "zcash" }),
    );
  });

  it("reports a failed sync as a failure, not a later retry as a success", () => {
    markPrivateBalanceEnabled("a6");
    mount([zcashAccount("a6", { syncState: "running", lastSyncError: null })]);
    mount([zcashAccount("a6", { syncState: "stopped", lastSyncError: "Error: engine down" })]);
    mount([zcashAccount("a6", { syncState: "complete" })]);

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith(
      "zcash_private_balance_first_sync_failed",
      expect.objectContaining({ reason: "sync_error" }),
    );
  });

  it("reports a failed manual sync once, which the account state shows as a user stop", () => {
    markPrivateBalanceEnabled("a7", Date.now() - 10 * MIN);
    mount([zcashAccount("a7", { syncState: "running", lastSyncError: null })]);
    markFirstSyncFailed("a7");
    mount([zcashAccount("a7", { syncState: "stopped", lastSyncError: null })]);
    mount([zcashAccount("a7", { syncState: "complete" })]);

    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith("zcash_private_balance_first_sync_failed", {
      currency: "zcash",
      durationBucket: "5m_30m",
      reason: "sync_error",
    });
  });

  it("ignores a failed manual sync of an account whose first sync is not awaited", () => {
    markFirstSyncFailed("a8");
    expect(mockedTrack).not.toHaveBeenCalled();
  });

  it("never tracks an account that was not marked", () => {
    mount([zcashAccount("a4", { syncState: "complete" })]);
    expect(mockedTrack).not.toHaveBeenCalled();
  });

  it("drops an account that was removed", () => {
    markPrivateBalanceEnabled("a5");
    mount([]);
    mount([zcashAccount("a5", { syncState: "complete" })]);
    expect(mockedTrack).not.toHaveBeenCalled();
  });
});

describe("ZcashFirstSyncTracking", () => {
  it("runs the first-sync observer as a component and renders nothing", () => {
    markPrivateBalanceEnabled("c1");
    const { container } = render(createElement(ZcashFirstSyncTracking), {
      initialState: { accounts: [zcashAccount("c1", { syncState: "complete" })] },
    });
    expect(container).toBeEmptyDOMElement();
    expect(mockedTrack).toHaveBeenCalledWith(
      "zcash_private_balance_first_sync_completed",
      expect.objectContaining({ currency: "zcash" }),
    );
  });
});
