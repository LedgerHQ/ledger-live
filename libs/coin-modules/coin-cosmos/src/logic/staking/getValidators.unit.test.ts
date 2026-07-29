import { CosmosAPI } from "../../network/Cosmos";
import { getValidators } from "./getValidators";

describe("logic/staking/getValidators", () => {
  it("maps bonded validators to framework Validators", async () => {
    const api = {
      getValidators: jest.fn().mockResolvedValue([
        {
          validatorAddress: "cosmosvaloper1abc",
          name: "Ledger",
          tokens: "1000000",
          votingPower: 0,
          commission: 0.05,
          estimatedYearlyRewardsRate: 0.18,
        },
      ]),
    } as unknown as CosmosAPI;

    const page = await getValidators(api);

    expect(page.items).toHaveLength(1);
    const v = page.items[0];
    expect(v.address).toBe("cosmosvaloper1abc");
    expect(v.name).toBe("Ledger");
    expect(v.balance).toBe(1000000n);
    expect(v.commissionRate).toBe("0.05");
    expect(v.apy).toBe(0.18);
    expect(page.next).toBe(undefined);
  });
});
