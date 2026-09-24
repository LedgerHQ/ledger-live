/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { HederaAccount } from "@ledgerhq/coin-hedera/types";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAccountRawAssignHooks } from "../../bridge/generic-coin-framework/accountRawAssign";

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

  it("leaves an account without hederaResources untouched", async () => {
    const { persisted, revived } = await roundTrip(undefined);

    expect(persisted).toEqual({});
    expect(revived).toEqual({});
  });
});
