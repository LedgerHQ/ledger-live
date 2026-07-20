import BigNumber from "bignumber.js";
import { CosmosAPI } from "../../network/Cosmos";
import { getBalance } from "./getBalance";

describe("logic/account/getBalance", () => {
  it("returns a single native balance from the account's total native amount", async () => {
    const api = {
      getAllBalances: jest.fn().mockResolvedValue(new BigNumber("1500000")),
    } as unknown as CosmosAPI;

    const balances = await getBalance(api, "cosmos1abc", "cosmos");

    expect(api.getAllBalances).toHaveBeenCalledWith(
      "cosmos1abc",
      expect.objectContaining({ id: "cosmos" }),
    );
    expect(balances).toHaveLength(1);
    expect(balances[0].value).toBe(1500000n);
    expect(balances[0].asset).toEqual({ type: "native" });
  });

  it("returns a zero native balance for a pristine account", async () => {
    const api = {
      getAllBalances: jest.fn().mockResolvedValue(new BigNumber("0")),
    } as unknown as CosmosAPI;

    const balances = await getBalance(api, "cosmos1pristine", "cosmos");

    expect(balances).toHaveLength(1);
    expect(balances[0].value).toBe(0n);
    expect(balances[0].asset).toEqual({ type: "native" });
  });
});
