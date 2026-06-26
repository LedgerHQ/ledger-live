import { Transaction, TransactionPayload, UserSigner } from "@multiversx/sdk-core";
import { UserSecretKey } from "@multiversx/sdk-core/out/wallet/userKeys";
import { randomBytes } from "crypto";
import MultiversXApiClient from "../api/apiCalls";
import { broadcast } from "./broadcast";

const API_ENDPOINT = "https://elrond.coin.ledger.com";
const DELEGATION_API_ENDPOINT = "https://delegations-elrond.coin.ledger.com";
const api = new MultiversXApiClient(API_ENDPOINT, DELEGATION_API_ENDPOINT);

const VALID_ADDRESS = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

jest.setTimeout(60_000);

describe("broadcast (integration)", () => {
  describe("input validation (no network round-trip)", () => {
    it("rejects malformed JSON", async () => {
      await expect(broadcast("not-json", api)).rejects.toThrow(/malformed JSON/);
    });

    it("rejects a transaction missing a signature", async () => {
      const tx = JSON.stringify({
        nonce: 0,
        value: "1",
        receiver: VALID_ADDRESS,
        sender: VALID_ADDRESS,
        gasPrice: 1_000_000_000,
        gasLimit: 50_000,
        chainID: "1",
      });

      await expect(broadcast(tx, api)).rejects.toThrow(/missing or empty signature/);
    });

    it("rejects a transaction missing required fields", async () => {
      const tx = JSON.stringify({ signature: "deadbeef", sender: VALID_ADDRESS });

      await expect(broadcast(tx, api)).rejects.toThrow(/missing required fields/);
    });

    it("rejects a transaction with an invalid sender address", async () => {
      const tx = JSON.stringify({
        nonce: 0,
        value: "1",
        receiver: VALID_ADDRESS,
        sender: "not-an-address",
        gasPrice: 1_000_000_000,
        gasLimit: 50_000,
        chainID: "1",
        signature: "deadbeef",
      });

      await expect(broadcast(tx, api)).rejects.toThrow(/invalid sender address format/);
    });
  });

  describe("real network submission", () => {
    it("is rejected with insufficient funds for a freshly generated (empty) account", async () => {
      const signer = new UserSigner(new UserSecretKey(randomBytes(32)));
      const sender = signer.getAddress();

      const tx = new Transaction({
        nonce: 0,
        sender,
        receiver: sender,
        value: "1",
        gasLimit: 50_000,
        chainID: "1",
        data: new TransactionPayload(""),
      });
      const signature = await signer.sign(tx.serializeForSigning());

      const signedTx = JSON.stringify({
        ...tx.toPlainObject(),
        signature: Buffer.from(signature).toString("hex"),
      });

      await expect(broadcast(signedTx, api)).rejects.toThrow(/insufficient funds/i);
    });
  });
});
