import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { mockDescriptors } from "./generate";
import { mockSource } from "./mockSource";

const readBalance = (descriptor: AccountDescriptor) => {
  const read = mockSource.read?.balance;
  if (!read) throw new Error("no balance reader");
  return read({ accountUUID: computeAccountUUID(descriptor), descriptor }, undefined);
};

/** Many accounts, to see each family's spread. */
const balancesOf = (network: string) =>
  Promise.all(mockDescriptors(network, 40, []).map(readBalance));

describe("mockSource", () => {
  it("serves the mock purpose only", () => {
    expect(mockSource.purposes).toEqual(["mock"]);
  });

  it("answers the same balance for the same account", async () => {
    const [account] = mockDescriptors("ethereum", 1, []);
    expect(await readBalance(account)).toEqual(await readBalance(account));
  });

  it("answers bitcoin balances in the native coin only, up to 2 BTC, all spendable, some empty", async () => {
    const balances = await balancesOf("bitcoin");
    for (const rows of balances) {
      expect(rows).toHaveLength(1);
      expect(rows[0].assetId).toBe("bitcoin");
      expect(rows[0].spendableBalance).toBe(rows[0].balance);
      expect(BigInt(rows[0].balance)).toBeLessThanOrEqual(200_000_000n);
    }
    expect(balances.some(([row]) => row.balance === "0")).toBe(true);
    expect(new Set(balances.map(([row]) => row.balance)).size).toBeGreaterThan(20);
  });

  it("answers ethereum balances with the coin first, then some tokens", async () => {
    const balances = await balancesOf("ethereum");
    for (const rows of balances) {
      expect(rows[0].assetId).toBe("ethereum");
      expect(BigInt(rows[0].balance)).toBeLessThanOrEqual(5n * 10n ** 18n);
    }
    const tokens = new Set(balances.flatMap(rows => rows.slice(1).map(row => row.assetId)));
    expect(tokens).toEqual(
      new Set(["ethereum/erc20/usd__coin", "ethereum/erc20/usd_tether__erc20_"]),
    );
  });

  it("answers the generic balance on a family without its own mock", async () => {
    const [account] = mockDescriptors("solana", 1, []);
    const rows = await readBalance(account);
    expect(rows).toEqual([expect.objectContaining({ assetId: "solana" })]);
  });
});
