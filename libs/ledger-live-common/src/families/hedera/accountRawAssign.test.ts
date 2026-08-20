/* eslint-disable @typescript-eslint/consistent-type-assertions */
import BigNumber from "bignumber.js";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { getAccountRawAssignHooks } from "../../bridge/generic-coin-framework/accountRawAssign";

describe("hedera accountRawAssign, wired through the generic framework's loader", () => {
  it("survives a hederaResources round trip through the raw boundary (delegating account)", async () => {
    const { assignToAccountRaw, assignFromAccountRaw } = await getAccountRawAssignHooks("hedera");
    const account = {
      hederaResources: {
        maxAutomaticTokenAssociations: -1,
        isAutoTokenAssociationEnabled: true,
        delegation: {
          nodeId: 3,
          delegated: new BigNumber("100000000"),
          pendingReward: new BigNumber("1234"),
        },
      },
    } as Account;
    const accountRaw = {} as AccountRaw;

    assignToAccountRaw?.(account, accountRaw);

    // BigNumber survives a JSON round trip as a bare decimal string.
    expect(JSON.parse(JSON.stringify(accountRaw))).toEqual({
      hederaResources: {
        maxAutomaticTokenAssociations: -1,
        isAutoTokenAssociationEnabled: true,
        delegation: { nodeId: 3, delegated: "100000000", pendingReward: "1234" },
      },
    });

    const revivedAccount = {} as Account;
    assignFromAccountRaw?.(accountRaw, revivedAccount);

    const revived = (revivedAccount as { hederaResources?: unknown }).hederaResources as {
      maxAutomaticTokenAssociations: number;
      isAutoTokenAssociationEnabled: boolean;
      delegation: { nodeId: number; delegated: BigNumber; pendingReward: BigNumber };
    };
    expect(revived.maxAutomaticTokenAssociations).toBe(-1);
    expect(revived.isAutoTokenAssociationEnabled).toBe(true);
    expect(revived.delegation.nodeId).toBe(3);
    expect(revived.delegation.delegated).toBeInstanceOf(BigNumber);
    expect(revived.delegation.delegated.toString()).toBe("100000000");
    expect(revived.delegation.pendingReward.toString()).toBe("1234");
  });

  it("survives a round trip for a non-delegating account (delegation: null)", async () => {
    const { assignToAccountRaw, assignFromAccountRaw } = await getAccountRawAssignHooks("hedera");
    const account = {
      hederaResources: {
        maxAutomaticTokenAssociations: 0,
        isAutoTokenAssociationEnabled: false,
        delegation: null,
      },
    } as Account;
    const accountRaw = {} as AccountRaw;

    assignToAccountRaw?.(account, accountRaw);
    const revivedAccount = {} as Account;
    assignFromAccountRaw?.(accountRaw, revivedAccount);

    expect((revivedAccount as { hederaResources?: unknown }).hederaResources).toEqual({
      maxAutomaticTokenAssociations: 0,
      isAutoTokenAssociationEnabled: false,
      delegation: null,
    });
  });
});
