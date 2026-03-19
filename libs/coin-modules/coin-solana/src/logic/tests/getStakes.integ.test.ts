import { Keypair } from "@solana/web3.js";
import { getChainAPI } from "../../network";
import { getStakes } from "../getStakes";

const api = getChainAPI({ endpoint: "https://solana.coin.ledger.com" });

const STAKER_ADDRESS = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const UNUSED_ADDRESS = Keypair.generate().publicKey.toBase58();

describe("getStakes (integration)", () => {
  it("returns well-formed stakes for a known address", async () => {
    const result = await getStakes(api, STAKER_ADDRESS);

    expect(Array.isArray(result.items)).toBe(true);

    for (const stake of result.items) {
      expect(typeof stake.uid).toBe("string");
      expect(stake.uid.length).toBeGreaterThan(0);
      expect(typeof stake.address).toBe("string");
      expect(["active", "inactive", "activating", "deactivating"]).toContain(stake.state);
      expect(stake.asset).toEqual({ type: "native" });
      expect(typeof stake.amount).toBe("bigint");
      expect(stake.amount).toBeGreaterThanOrEqual(0n);

      if (stake.delegate) {
        expect(typeof stake.delegate).toBe("string");
        expect(stake.delegate.length).toBeGreaterThan(0);
      }
      if (stake.amountDeposited !== undefined) {
        expect(typeof stake.amountDeposited).toBe("bigint");
      }
      expect(stake.details).not.toBeUndefined();
      expect(typeof stake.details?.rentExemptReserve).toBe("string");
    }
  });

  it("returns empty page for an unused address", async () => {
    const result = await getStakes(api, UNUSED_ADDRESS);

    expect(result).toEqual({ items: [] });
  });
});
