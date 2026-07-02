import type { Balance, Stake } from "@ledgerhq/coin-module-framework/api/index";

jest.mock("./getStakes", () => ({ buildCeloStakes: jest.fn() }));

import { makeGetBalance } from "./getBalance";
import { buildCeloStakes } from "./getStakes";

const ADDR = "0x7777777777777777777777777777777777777777";
const GROUP = "0x4444444444444444444444444444444444444444";
const NATIVE: Balance = { value: 500n, asset: { type: "native" }, locked: 0n };

const stake = (uid: string, amount: bigint): Stake => ({
  uid,
  address: ADDR,
  delegate: GROUP,
  state: "active",
  actions: ["undelegate"],
  asset: { type: "native" },
  amount,
});

describe("makeGetBalance", () => {
  beforeEach(() => (buildCeloStakes as jest.Mock).mockReset());

  it("appends staking positions as native Balance entries with .stake, base balance first", async () => {
    const base = jest.fn(async (): Promise<Balance[]> => [NATIVE]);
    (buildCeloStakes as jest.Mock).mockResolvedValue([stake("s1", 100n)]);

    const balances = await makeGetBalance(base)(ADDR);

    expect(base).toHaveBeenCalledWith(ADDR, undefined);
    expect(balances).toHaveLength(2);
    // native balance stays first so extractBalance(..., "native") resolves it
    expect(balances[0]).toBe(NATIVE);
    expect(balances[1].stake?.uid).toBe("s1");
    expect(balances[1].stake?.amount).toBe(100n);
    // value is 0 so it can't be mistaken for the native balance; the amount lives on .stake
    expect(balances[1].value).toBe(0n);
    expect(balances[1].asset.type).toBe("native");
  });

  it("drops coin-evm's inherited staking positions, keeping only Celo's", async () => {
    const evmShim: Balance = {
      value: 0n,
      asset: { type: "native" },
      stake: stake("evm-shim", 999n),
    };
    const base = jest.fn(async (): Promise<Balance[]> => [NATIVE, evmShim]);
    (buildCeloStakes as jest.Mock).mockResolvedValue([stake("celo-vote", 100n)]);

    const balances = await makeGetBalance(base)(ADDR);

    // coin-evm's embedded (governance-delegation) stake is removed; native kept; only Celo's appended
    expect(balances).toHaveLength(2);
    expect(balances[0]).toBe(NATIVE);
    expect(balances.some(b => b.stake?.uid === "evm-shim")).toBe(false);
    expect(balances[1].stake?.uid).toBe("celo-vote");
  });

  it("passes balance options through to the base getBalance", async () => {
    const base = jest.fn(async (): Promise<Balance[]> => [NATIVE]);
    (buildCeloStakes as jest.Mock).mockResolvedValue([]);
    const options = { includeAssets: async () => true };

    await makeGetBalance(base)(ADDR, options);

    expect(base).toHaveBeenCalledWith(ADDR, options);
  });

  it("degrades to the base balances when stake fetching fails", async () => {
    const base = jest.fn(async (): Promise<Balance[]> => [NATIVE]);
    (buildCeloStakes as jest.Mock).mockRejectedValue(new Error("rpc down"));

    const balances = await makeGetBalance(base)(ADDR);

    expect(balances).toEqual([NATIVE]);
  });
});
