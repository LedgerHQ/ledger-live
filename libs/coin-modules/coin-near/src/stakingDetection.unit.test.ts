import BigNumber from "bignumber.js";
import { stakingPoolOf } from "./network/indexer";
import type { NearTransaction } from "./network/sdk.types";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromNearResourcesRaw,
  toNearResourcesRaw,
} from "./serialization";

const ACCOUNT = "a".repeat(64);
const tx = (
  actions: { action: string; method: string | null }[],
  signer = ACCOUNT,
): NearTransaction =>
  ({
    signer_account_id: signer,
    receiver_account_id: "pool.poolv1.near",
    actions,
  }) as NearTransaction;

describe("stakingPoolOf", () => {
  it.each([
    "deposit_and_stake",
    "deposit",
    "stake",
    "stake_all",
    "unstake",
    "unstake_all",
    "withdraw",
    "withdraw_all",
  ])("recognises %s in any action", method => {
    expect(
      stakingPoolOf(
        tx([
          { action: "TRANSFER", method: null },
          { action: "FUNCTION_CALL", method },
        ]),
        ACCOUNT,
      ),
    ).toBe("pool.poolv1.near");
  });

  it("ignores other calls", () => {
    expect(
      stakingPoolOf(tx([{ action: "FUNCTION_CALL", method: "ft_transfer" }]), ACCOUNT),
    ).toBeUndefined();
  });

  it("ignores a staking call the account did not sign", () => {
    expect(
      stakingPoolOf(
        tx([{ action: "FUNCTION_CALL", method: "deposit_and_stake" }], "other.near"),
        ACCOUNT,
      ),
    ).toBeUndefined();
  });
});

describe("near resources serialization", () => {
  const resources = {
    stakedBalance: new BigNumber(1),
    availableBalance: new BigNumber(2),
    pendingBalance: new BigNumber(3),
    storageUsageBalance: new BigNumber(4),
    stakingPositions: [],
  };

  it("round-trips the account state marker and the recheck flag", () => {
    const withState = {
      ...resources,
      accountStateFingerprint: "10:0:100:1:5",
      historyRecheckPending: true,
    };
    expect(fromNearResourcesRaw(toNearResourcesRaw(withState))).toEqual(withState);
  });

  it("omits them when absent", () => {
    const raw = toNearResourcesRaw(resources);
    expect(raw).not.toHaveProperty("accountStateFingerprint");
    expect(raw).not.toHaveProperty("historyRecheckPending");
  });
});

describe("account raw hooks", () => {
  const nearResources = {
    stakedBalance: new BigNumber(1),
    availableBalance: new BigNumber(0),
    pendingBalance: new BigNumber(0),
    storageUsageBalance: new BigNumber(4),
    stakingPositions: [
      {
        validatorId: "p.poolv1.near",
        staked: new BigNumber(1),
        available: new BigNumber(0),
        pending: new BigNumber(0),
      },
    ],
    accountStateFingerprint: "fp",
  };

  it("writes and reads back the NEAR resources", () => {
    const raw: Record<string, unknown> = {};
    assignToAccountRaw({ nearResources } as never, raw as never);
    const account: Record<string, unknown> = {};
    assignFromAccountRaw(raw as never, account as never);
    expect(account.nearResources).toEqual(nearResources);
  });

  it("leaves accounts without NEAR resources untouched", () => {
    const raw: Record<string, unknown> = {};
    assignToAccountRaw({} as never, raw as never);
    const account: Record<string, unknown> = {};
    assignFromAccountRaw(raw as never, account as never);
    expect(raw).toEqual({});
    expect(account).toEqual({});
  });
});
