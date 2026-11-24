import BigNumber from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromNearResourcesRaw,
  toNearResourcesRaw,
} from "./serialization";
import type { NearResources } from "./types";

const base = (): NearResources => ({
  stakedBalance: new BigNumber(1),
  availableBalance: new BigNumber(2),
  pendingBalance: new BigNumber(3),
  storageUsageBalance: new BigNumber(4),
  stakingPositions: [
    {
      validatorId: "pool.near",
      staked: new BigNumber(5),
      available: new BigNumber(6),
      pending: new BigNumber(7),
    },
  ],
});

describe("near resources serialization", () => {
  it("round-trips the fingerprint, the recheck state, the history and listing markers and the pending pools", () => {
    const resources = {
      ...base(),
      accountStateFingerprint: "a|b",
      historyRecheckSince: 1_700_000_000_000,
      historyRecheckFingerprint: "c|d",
      historyConfirmPending: true,
      historyConfirmBoundary: "tx-0",
      poolListingPending: true,
      pendingCandidatePools: ["new.poolv1.near"],
      historyEmpty: true,
      pendingCandidatesSince: 1_700_000_000_001,
      historyFailedSince: 1_700_000_000_002,
      historyUnsettledSince: 1_700_000_000_003,
      historyUnsettledHashes: ["tx-1", "tx-2"],
      historyEmptySince: 1_700_000_000_004,
    };

    const raw = toNearResourcesRaw(resources);

    expect(raw.accountStateFingerprint).toBe("a|b");
    expect(raw.historyRecheckSince).toBe(1_700_000_000_000);
    expect(raw.historyConfirmPending).toBe(true);
    expect(raw.historyConfirmBoundary).toBe("tx-0");
    expect(raw.poolListingPending).toBe(true);
    expect(raw.historyRecheckFingerprint).toBe("c|d");
    expect(raw.pendingCandidatePools).toEqual(["new.poolv1.near"]);
    expect(raw.historyEmpty).toBe(true);
    expect(raw.pendingCandidatesSince).toBe(1_700_000_000_001);
    expect(raw.historyFailedSince).toBe(1_700_000_000_002);
    expect(raw.historyUnsettledSince).toBe(1_700_000_000_003);
    expect(raw.historyUnsettledHashes).toEqual(["tx-1", "tx-2"]);
    expect(raw.historyEmptySince).toBe(1_700_000_000_004);
    expect(fromNearResourcesRaw(raw)).toEqual(resources);
  });

  it("round-trips a false listing marker", () => {
    const raw = toNearResourcesRaw({ ...base(), poolListingPending: false });

    expect(raw.poolListingPending).toBe(false);
    expect(fromNearResourcesRaw(raw).poolListingPending).toBe(false);
  });

  it("round-trips an account stored before the fingerprint existed without adding the fields", () => {
    const raw = toNearResourcesRaw(base());

    expect(raw).not.toHaveProperty("accountStateFingerprint");
    expect(raw).not.toHaveProperty("historyRecheckSince");
    expect(raw).not.toHaveProperty("historyConfirmPending");
    expect(raw).not.toHaveProperty("historyConfirmBoundary");
    expect(raw).not.toHaveProperty("poolListingPending");
    expect(raw).not.toHaveProperty("historyRecheckFingerprint");
    expect(raw).not.toHaveProperty("pendingCandidatePools");
    expect(raw).not.toHaveProperty("historyEmpty");
    expect(raw).not.toHaveProperty("pendingCandidatesSince");
    expect(raw).not.toHaveProperty("historyFailedSince");
    expect(raw).not.toHaveProperty("historyUnsettledSince");
    expect(raw).not.toHaveProperty("historyUnsettledHashes");
    expect(raw).not.toHaveProperty("historyEmptySince");
    expect(fromNearResourcesRaw(raw)).toEqual(base());
    expect(fromNearResourcesRaw(raw)).not.toHaveProperty("accountStateFingerprint");
  });

  it("carries the fingerprint through the account raw hooks", () => {
    const resources = { ...base(), accountStateFingerprint: "a|b", historyRecheckSince: 1 };
    const raw = {} as AccountRaw;
    assignToAccountRaw({ nearResources: resources } as unknown as Account, raw);

    const account = {} as Account;
    assignFromAccountRaw(raw, account);

    expect((account as unknown as { nearResources: unknown }).nearResources).toEqual(resources);
  });

  it("leaves an account without NEAR resources untouched", () => {
    const raw = {} as AccountRaw;
    const account = {} as Account;

    assignToAccountRaw(account, raw);
    assignFromAccountRaw(raw, account);

    expect(raw).toEqual({});
    expect(account).toEqual({});
  });
});
