import { UserSigner } from "@multiversx/sdk-core";
import { UserSecretKey } from "@multiversx/sdk-core/out/wallet/userKeys";
import { randomBytes } from "crypto";
import MultiversXApiClient from "../api/apiCalls";
import { getStakes } from "./getStakes";

const API_ENDPOINT = "https://elrond.coin.ledger.com";
const DELEGATION_API_ENDPOINT = "https://delegations-elrond.coin.ledger.com";
const api = new MultiversXApiClient(API_ENDPOINT, DELEGATION_API_ENDPOINT);

// Addresses that may hold delegations. Mainnet state can change, so tests that
// assert on stake contents tolerate the "no delegations" case.
const STAKER_CANDIDATES = [
  "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
  "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2",
];
const UNUSED_ADDRESS = new UserSigner(new UserSecretKey(randomBytes(32))).getAddress().bech32();

const VALID_STATES = ["active", "deactivating", "inactive"];

jest.setTimeout(120_000);

describe("getStakes (integration)", () => {
  it("returns a single-page Page structure (no pagination from the delegation API)", async () => {
    const result = await getStakes(api, STAKER_CANDIDATES[0]);

    expect(Array.isArray(result.items)).toBe(true);
    expect(result.next).toBeUndefined();
  });

  it("returns well-formed stakes when delegations exist", async () => {
    for (const address of STAKER_CANDIDATES) {
      const { items } = await getStakes(api, address);
      if (items.length === 0) continue;

      for (const stake of items) {
        expect(stake.uid).toBe(`${stake.address}-${stake.delegate}`);
        expect(stake.address).toBe(address);
        expect(stake.delegate).toMatch(/^erd1/);
        expect(VALID_STATES).toContain(stake.state);
        expect(stake.asset).toEqual({ type: "native" });
        expect(typeof stake.amount).toBe("bigint");
        expect(stake.amount).toBeGreaterThanOrEqual(0n);
      }
      return;
    }
    // No candidate had delegations at run time — nothing to assert.
  });

  it("returns an empty page for an address with no delegations", async () => {
    const result = await getStakes(api, UNUSED_ADDRESS);

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("throws for an invalid address", async () => {
    await expect(getStakes(api, "not-a-valid-address")).rejects.toThrow(
      /Invalid MultiversX address/,
    );
  });
});
