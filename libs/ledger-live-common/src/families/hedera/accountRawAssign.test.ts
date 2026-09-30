/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { HederaAccount } from "@ledgerhq/coin-hedera/types";
import type { Operation as CoreOperation } from "@ledgerhq/coin-module-framework/api/types";
import type { Account, AccountRaw, OperationExtra } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccountRawAssignHooks } from "../../bridge/generic-coin-framework/accountRawAssign";
import { adaptCoreOperationToLiveOperation } from "../../bridge/generic-coin-framework/utils";

async function roundTrip(hederaResources: HederaAccount["hederaResources"]) {
  const { assignToAccountRaw, assignFromAccountRaw } = await getAccountRawAssignHooks("hedera");
  const accountRaw = {} as AccountRaw;
  assignToAccountRaw?.({ hederaResources } as unknown as Account, accountRaw);

  const persisted = JSON.parse(JSON.stringify(accountRaw)) as AccountRaw;
  const revived = {} as HederaAccount;
  assignFromAccountRaw?.(persisted, revived);

  return { persisted, revived };
}

describe("hedera accountRawAssign", () => {
  it("round trips a delegating account's hederaResources", async () => {
    const { persisted, revived } = await roundTrip({
      maxAutomaticTokenAssociations: -1,
      isAutoTokenAssociationEnabled: true,
      delegation: {
        nodeId: 3,
        delegated: new BigNumber(100_000_000),
        pendingReward: new BigNumber(1234),
      },
    });

    expect(persisted).toEqual({
      hederaResources: {
        maxAutomaticTokenAssociations: -1,
        isAutoTokenAssociationEnabled: true,
        delegation: { nodeId: 3, delegated: "100000000", pendingReward: "1234" },
      },
    });
    expect(revived.hederaResources?.delegation?.delegated).toBeInstanceOf(BigNumber);
    expect(revived.hederaResources?.delegation?.pendingReward).toBeInstanceOf(BigNumber);
    expect(revived.hederaResources).toEqual({
      maxAutomaticTokenAssociations: -1,
      isAutoTokenAssociationEnabled: true,
      delegation: {
        nodeId: 3,
        delegated: new BigNumber(100_000_000),
        pendingReward: new BigNumber(1234),
      },
    });
  });

  it("round trips a non-delegating account's hederaResources", async () => {
    const hederaResources = {
      maxAutomaticTokenAssociations: 0,
      isAutoTokenAssociationEnabled: false,
      delegation: null,
    };

    const { revived } = await roundTrip(hederaResources);

    expect(revived.hederaResources).toEqual(hederaResources);
  });

  it("keeps the generic stakingResources alongside hederaResources", async () => {
    const { assignToAccountRaw, assignFromAccountRaw } = await getAccountRawAssignHooks("hedera");
    const accountRaw = {} as AccountRaw;
    assignToAccountRaw?.(
      {
        hederaResources: {
          maxAutomaticTokenAssociations: 0,
          isAutoTokenAssociationEnabled: false,
          delegation: null,
        },
        stakingResources: {
          delegations: [],
          unbondings: [],
          redelegations: [],
          delegatedBalance: new BigNumber(100),
          pendingRewardsBalance: new BigNumber(7),
          unbondingBalance: new BigNumber(0),
        },
      } as unknown as Account,
      accountRaw,
    );

    const revived = {} as Account;
    assignFromAccountRaw?.(JSON.parse(JSON.stringify(accountRaw)) as AccountRaw, revived);

    expect(revived).toMatchObject({
      hederaResources: { delegation: null },
      stakingResources: { pendingRewardsBalance: new BigNumber(7) },
    });
  });

  it("leaves an account without hederaResources untouched", async () => {
    const { persisted, revived } = await roundTrip(undefined);

    expect(persisted).toEqual({});
    expect(revived).toEqual({});
  });

  it("round trips a staking operation's stakedAmount as a BigNumber", async () => {
    const { toOperationExtraRaw, fromOperationExtraRaw } = await getAccountRawAssignHooks("hedera");
    const extra: OperationExtra = {
      ledgerOpType: "DELEGATE",
      stakedAmount: new BigNumber("21083322293"),
      targetStakingNodeId: 3,
    };

    const persisted = JSON.parse(JSON.stringify(toOperationExtraRaw?.(extra)));
    const revived = fromOperationExtraRaw?.(persisted) as Record<string, unknown>;

    expect(persisted).toMatchObject({ stakedAmount: "21083322293" });
    expect(revived.stakedAmount).toStrictEqual(new BigNumber("21083322293"));
    expect(revived).toMatchObject({ ledgerOpType: "DELEGATE", targetStakingNodeId: 3 });
  });

  it("revives stakedAmount as a BigNumber on a freshly synced staking operation", async () => {
    const { fromOperationExtraRaw } = await getAccountRawAssignHooks("hedera");
    const coreOperation: CoreOperation = {
      id: "op1",
      asset: { type: "native" },
      type: "DELEGATE",
      value: BigInt(0),
      senders: ["0.0.1234"],
      recipients: [],
      tx: {
        hash: "hash1",
        fees: BigInt(1),
        block: { hash: "blockhash1", height: 1, time: new Date("2026-01-01") },
        date: new Date("2026-01-01"),
        failed: false,
      },
      details: {
        ledgerOpType: "DELEGATE",
        stakedAmount: BigInt(21083322293),
        familyExtra: { stakedAmount: "21083322293", targetStakingNodeId: 3 },
      },
    };

    const operation = adaptCoreOperationToLiveOperation(
      "accountId",
      coreOperation,
      fromOperationExtraRaw,
    );

    expect((operation.extra as Record<string, unknown>).stakedAmount).toStrictEqual(
      new BigNumber("21083322293"),
    );
    expect(operation.extra).toMatchObject({ ledgerOpType: "DELEGATE", targetStakingNodeId: 3 });
  });
});
