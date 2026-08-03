import BigNumber from "bignumber.js";
import { CosmosAPI } from "../../network/Cosmos";
import { getBalance } from "./getBalance";

describe("logic/account/getBalance", () => {
  it("returns a single native balance from the account's total native amount", async () => {
    const api = {
      getCurrency: () => ({ id: "cosmos", units: [{}, { code: "uatom" }] }),
      getAllBalances: jest.fn().mockResolvedValue(new BigNumber("1500000")),
      getStakingPositions: jest.fn().mockResolvedValue({ delegations: [], unbondings: [] }),
    } as unknown as CosmosAPI;

    const balances = await getBalance(api, "cosmos1abc");

    expect(api.getAllBalances).toHaveBeenCalledWith(
      "cosmos1abc",
      expect.objectContaining({ id: "cosmos" }),
    );
    expect(balances).toHaveLength(1);
    expect(balances[0].value).toBe(1500000n);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].locked).toBe(0n);
  });

  it("returns a zero native balance for a pristine account", async () => {
    const api = {
      getCurrency: () => ({ id: "cosmos", units: [{}, { code: "uatom" }] }),
      getAllBalances: jest.fn().mockResolvedValue(new BigNumber("0")),
      getStakingPositions: jest.fn().mockResolvedValue({ delegations: [], unbondings: [] }),
    } as unknown as CosmosAPI;

    const balances = await getBalance(api, "cosmos1pristine");

    expect(balances).toHaveLength(1);
    expect(balances[0].value).toBe(0n);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].locked).toBe(0n);
  });

  it("returns a native balance (value incl staked, locked=staked) plus per-position stake balances", async () => {
    const api = {
      getCurrency: () => ({ id: "cosmos", units: [{}, { code: "uatom" }] }),
      getAllBalances: jest.fn().mockResolvedValue(new BigNumber("7000000")), // liquid
      getStakingPositions: jest.fn().mockResolvedValue({
        delegations: [
          {
            validatorAddress: "cosmosvaloper1v",
            amount: new BigNumber("1000000"),
            pendingRewards: new BigNumber("2500"),
            status: "bonded",
          },
        ],
        unbondings: [
          {
            validatorAddress: "cosmosvaloper1v",
            amount: new BigNumber("500000"),
            completionDate: new Date(Date.now() + 86_400_000),
          },
        ],
      }),
    } as unknown as CosmosAPI;

    const balances = await getBalance(api, "cosmos1a");

    const native = balances[0];
    expect(native.asset).toEqual({ type: "native" });
    expect(native.value).toBe(8_500_000n); // 7,000,000 liquid + 1,000,000 delegated + 500,000 unbonding
    expect(native.locked).toBe(1_500_000n); // delegated + unbonding (rewards excluded)
    const stakeBalances = balances.slice(1);
    expect(stakeBalances).toHaveLength(2);
    expect(stakeBalances[0].stake?.delegate).toBe("cosmosvaloper1v");
    expect(stakeBalances[0].value).toBe(1_000_000n); // principal
  });
});
