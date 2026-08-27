import { fetchAllTokenBalances, fetchBalances } from "../../network/api";
import { getStakes } from "../getStakes";
import { getBalance, NATIVE_ASSET, tokenAsset } from "../getBalance";

jest.mock("../../network/api");
jest.mock("../getStakes");

describe("getBalance", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the native balance and token balances when nothing is locked", async () => {
    (fetchBalances as jest.Mock).mockResolvedValue({ balance: "1000000", locked: "0" });
    (fetchAllTokenBalances as jest.Mock).mockResolvedValue({
      "sp_contract.token-x::token-x": "5000",
    });

    const balances = await getBalance("SP_ADDRESS");

    expect(balances).toEqual([
      { value: 1000000n, asset: NATIVE_ASSET },
      { value: 5000n, asset: tokenAsset("sp_contract.token-x::token-x", "SP_ADDRESS") },
    ]);
    expect(getStakes).not.toHaveBeenCalled();
  });

  it("attaches locked/stake to the native balance when an amount is locked", async () => {
    (fetchBalances as jest.Mock).mockResolvedValue({
      balance: "200500000000",
      locked: "200000000000",
    });
    (fetchAllTokenBalances as jest.Mock).mockResolvedValue({});
    const stake = { uid: "SP_ADDRESS" };
    (getStakes as jest.Mock).mockResolvedValue({ items: [stake] });

    const [native] = await getBalance("SP_ADDRESS");

    expect(native.locked).toBe(200000000000n);
    expect(native.stake).toBe(stake);
  });
});
