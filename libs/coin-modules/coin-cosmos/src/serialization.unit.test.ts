import { BigNumber } from "bignumber.js";
import type { AccountRaw } from "@ledgerhq/types-live";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import type { CosmosAccount, CosmosAccountRaw, CosmosResources, CosmosResourcesRaw } from "./types";

function makeResources(publicKey: string): CosmosResources {
  return {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: new BigNumber(0),
    pendingRewardsBalance: new BigNumber(0),
    unbondingBalance: new BigNumber(0),
    withdrawAddress: "cosmos1xxx",
    sequence: 3,
    publicKey,
  };
}

function makeRawResources(publicKey?: string): CosmosResourcesRaw {
  return {
    delegations: [],
    redelegations: [],
    unbondings: [],
    delegatedBalance: "0",
    pendingRewardsBalance: "0",
    unbondingBalance: "0",
    withdrawAddress: "cosmos1xxx",
    sequence: 3,
    ...(publicKey !== undefined ? { publicKey } : {}),
  };
}

describe("cosmos serialization: publicKey", () => {
  it("persists publicKey from account to raw", () => {
    const account = { cosmosResources: makeResources("02ab") } as unknown as CosmosAccount;
    const accountRaw = {} as AccountRaw;

    assignToAccountRaw(account, accountRaw);

    expect((accountRaw as CosmosAccountRaw).cosmosResources.publicKey).toBe("02ab");
  });

  it("restores publicKey from raw to account", () => {
    const accountRaw = {
      cosmosResources: makeRawResources("02ab"),
    } as unknown as CosmosAccountRaw;
    const account = {} as CosmosAccount;

    assignFromAccountRaw(accountRaw, account);

    expect(account.cosmosResources.publicKey).toBe("02ab");
  });

  it("round-trips publicKey through raw and back", () => {
    const account = { cosmosResources: makeResources("0399ff") } as unknown as CosmosAccount;
    const accountRaw = {} as AccountRaw;

    assignToAccountRaw(account, accountRaw);
    const restored = {} as CosmosAccount;
    assignFromAccountRaw(accountRaw, restored);

    expect(restored.cosmosResources.publicKey).toBe("0399ff");
  });

  it("defaults to empty string for accounts persisted before publicKey existed", () => {
    // legacy raw with no publicKey field
    const accountRaw = {
      cosmosResources: makeRawResources(),
    } as unknown as CosmosAccountRaw;
    const account = {} as CosmosAccount;

    assignFromAccountRaw(accountRaw, account);

    expect(account.cosmosResources.publicKey).toBe("");
  });
});
