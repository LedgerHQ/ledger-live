import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { BigNumber } from "bignumber.js";
import { formatAccountSpecifics } from "./formatters";
import type { CosmosAccount } from "./types";

const currency = getCryptoCurrencyById("cosmos");

function makeAccount(
  stakingResources: CosmosAccount["stakingResources"],
  spendableBalance = new BigNumber(1_000_000),
): CosmosAccount {
  return {
    type: "Account",
    currency,
    spendableBalance,
    stakingResources,
  } as unknown as CosmosAccount;
}

describe("formatAccountSpecifics", () => {
  it("reads delegations/unbondings/redelegations from stakingResources, not cosmosResources", () => {
    const account = makeAccount({
      delegations: [
        {
          validatorAddress: "cosmosvaloper1qwl879nx9t6kef4supyazayf7vjhennyh568ys",
          amount: new BigNumber(500_000),
          pendingRewards: new BigNumber(0),
          status: "bonded",
        },
      ],
      unbondings: [
        {
          validatorAddress: "cosmosvaloper1qs8tnw2t8l6amtzvdemnnsq9dzk0ag0z52uzay",
          amount: new BigNumber(200_000),
          completionDate: new Date("2030-01-01T00:00:00.000Z"),
        },
      ],
      redelegations: [
        {
          validatorSrcAddress: "cosmosvaloper1qwl879nx9t6kef4supyazayf7vjhennyh568ys",
          validatorDstAddress: "cosmosvaloper1qs8tnw2t8l6amtzvdemnnsq9dzk0ag0z52uzay",
          amount: new BigNumber(50_000),
          completionDate: new Date("2030-01-01T00:00:00.000Z"),
        },
      ],
      delegatedBalance: new BigNumber(500_000),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(200_000),
    });
    // cosmosResources is intentionally absent — formatAccountSpecifics must not read it.
    delete (account as unknown as { cosmosResources?: unknown }).cosmosResources;

    const str = formatAccountSpecifics(account);

    expect(str).toContain("delegated");
    expect(str).toContain("unbonding");
    expect(str).toContain("DELEGATIONS");
    expect(str).toContain("UNDELEGATIONS");
    expect(str).toContain("REDELEGATIONS");
    expect(str).toContain("cosmosvaloper1qwl879nx9t6kef4supyazayf7vjhennyh568ys");
    expect(str).toContain("cosmosvaloper1qs8tnw2t8l6amtzvdemnnsq9dzk0ag0z52uzay");
  });

  it("omits delegated/unbonding lines and section headers when stakingResources is empty", () => {
    const account = makeAccount({
      delegations: [],
      unbondings: [],
      redelegations: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    });

    const str = formatAccountSpecifics(account);

    expect(str).toContain("spendable");
    expect(str).not.toContain("delegated");
    expect(str).not.toContain("unbonding");
    expect(str).not.toContain("DELEGATIONS");
    expect(str).not.toContain("UNDELEGATIONS");
    expect(str).not.toContain("REDELEGATIONS");
  });
});
