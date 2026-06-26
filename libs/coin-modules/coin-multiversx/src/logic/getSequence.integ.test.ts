import { UserSigner } from "@multiversx/sdk-core";
import { UserSecretKey } from "@multiversx/sdk-core/out/wallet/userKeys";
import { randomBytes } from "crypto";
import MultiversXApiClient from "../api/apiCalls";
import { getSequence } from "./getSequence";

const API_ENDPOINT = "https://elrond.coin.ledger.com";
const DELEGATION_API_ENDPOINT = "https://delegations-elrond.coin.ledger.com";
const api = new MultiversXApiClient(API_ENDPOINT, DELEGATION_API_ENDPOINT);

const ACTIVE_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const UNFUNDED_ADDRESS = new UserSigner(new UserSecretKey(randomBytes(32))).getAddress().bech32();

jest.setTimeout(60_000);

describe("getSequence (integration)", () => {
  it("returns the current nonce as a non-negative bigint for an active account", async () => {
    const nonce = await getSequence(api, ACTIVE_ADDRESS);

    expect(typeof nonce).toBe("bigint");
    expect(nonce).toBeGreaterThanOrEqual(0n);
  });

  it("returns 0n for a fresh (never-used) account", async () => {
    const nonce = await getSequence(api, UNFUNDED_ADDRESS);

    expect(nonce).toBe(0n);
  });

  it("throws for an invalid address", async () => {
    await expect(getSequence(api, "not-a-valid-address")).rejects.toThrow(
      /Invalid MultiversX address/,
    );
  });
});
