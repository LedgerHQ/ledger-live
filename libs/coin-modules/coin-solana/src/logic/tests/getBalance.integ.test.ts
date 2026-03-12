import { Keypair } from "@solana/web3.js";
import { getChainAPI } from "../../network";
import { endpointByCurrencyId } from "../../utils";
import { getBalance } from "../getBalance";

const api = getChainAPI({ endpoint: endpointByCurrencyId("solana") });

const FUNDED_ADDRESS = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const UNFUNDED_ADDRESS = Keypair.generate().publicKey.toBase58();

describe("getBalance (integration)", () => {
  it("returns native balance for a funded account", async () => {
    const balances = await getBalance(api, FUNDED_ADDRESS);

    expect(balances.length).toBeGreaterThanOrEqual(1);

    const native = balances[0];
    expect(native.asset).toEqual({ type: "native" });
    expect(native.value).toBeGreaterThan(0n);
    expect(native.locked).toBeGreaterThan(0n);

    const tokenBalances = balances.slice(1);
    for (const b of tokenBalances) {
      expect(b.asset.type).toMatch(/^spl-token(-2022)?$/);
      expect(b.asset).toHaveProperty(
        "assetReference",
        expect.stringMatching(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
      );
      expect(b.value).toBeGreaterThanOrEqual(0n);
    }
  });

  it("returns zero balance for an unfunded account", async () => {
    const balances = await getBalance(api, UNFUNDED_ADDRESS);

    expect(balances).toHaveLength(1);
    expect(balances[0].asset).toEqual({ type: "native" });
    expect(balances[0].value).toBe(0n);
    expect(balances[0].locked).toBe(0n);
  });
});
