import { Transaction, CasperNetwork, KeyAlgorithm, PrivateKey } from "casper-js-sdk";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import { createApi } from "./index";
import { FUNDED_MAINNET_PUBLIC_KEY } from "../__tests__/fixtures/addresses.fixture";
import { casperMainnetConfig } from "../__tests__/fixtures/config.fixture";
import {
  CASPER_DEFAULT_TTL,
  CASPER_DUMMY_ADDRESS,
  CASPER_FEES_MOTES,
  CASPER_NETWORK,
} from "../constants";
import { getCasperNodeRpcClient } from "../network/api";

describe("Casper Api (mainnet)", () => {
  let api: CoinModuleApi;

  beforeAll(() => {
    api = createApi(casperMainnetConfig);
  });

  describe("combine", () => {
    const craftUnsignedTransfer = async (sender: PrivateKey, recipient: PrivateKey) => {
      const casperNetwork = await CasperNetwork.create(getCasperNodeRpcClient());
      return casperNetwork.createTransferTransaction(
        sender.publicKey,
        recipient.publicKey,
        CASPER_NETWORK,
        "2500000000",
        CASPER_FEES_MOTES,
        CASPER_DEFAULT_TTL,
        0,
      );
    };

    it("attaches a signature to a real network-crafted transaction and produces a payload Transaction.fromJSON verifies", async () => {
      const sender = PrivateKey.generate(KeyAlgorithm.SECP256K1);
      const recipient = PrivateKey.generate(KeyAlgorithm.SECP256K1);

      const unsignedTx = await craftUnsignedTransfer(sender, recipient);
      const unsignedTxJson = JSON.stringify(unsignedTx.toJSON());

      // Matches TransactionV1.sign()/validate(): the signed message is the transaction hash,
      // not the serialized transaction bytes.
      const taggedSignature = Buffer.from(
        sender.signAndAddAlgorithmBytes(new Uint8Array(unsignedTx.hash.toBytes())),
      ).toString("hex");

      const combined = await api.combine(unsignedTxJson, taggedSignature, sender.publicKey.toHex());

      expect(() => Transaction.fromJSON(combined)).not.toThrow();
    });

    it("throws when pubkey is missing", async () => {
      const sender = PrivateKey.generate(KeyAlgorithm.SECP256K1);
      const recipient = PrivateKey.generate(KeyAlgorithm.SECP256K1);

      const unsignedTx = await craftUnsignedTransfer(sender, recipient);
      const unsignedTxJson = JSON.stringify(unsignedTx.toJSON());

      const taggedSignature = Buffer.from(
        sender.signAndAddAlgorithmBytes(new Uint8Array(unsignedTx.hash.toBytes())),
      ).toString("hex");

      expect(() => api.combine(unsignedTxJson, taggedSignature, undefined)).toThrow(
        "casper: combine requires the signer public key",
      );
    });
  });

  describe("lastBlock", () => {
    it("returns the latest block with valid height, hash and time", async () => {
      const block = await api.lastBlock();

      expect(block.height).toBeGreaterThan(0);
      expect(typeof block.hash).toBe("string");
      expect((block.hash as string).length).toBeGreaterThan(0);

      const oneDayMs = 24 * 60 * 60 * 1000;
      expect(block.time).toBeInstanceOf(Date);
      expect(block.time?.getTime()).toBeGreaterThan(Date.now() - oneDayMs);
      expect(block.time?.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("getBalance", () => {
    it("returns the native CSPR balance of a funded account", async () => {
      const balances = await api.getBalance(FUNDED_MAINNET_PUBLIC_KEY);

      expect(balances).toEqual([expect.objectContaining({ asset: { type: "native" } })]);
      expect(balances[0].value).toBeGreaterThan(0n);
    });

    it("returns a zero native balance for an account that was never funded", async () => {
      const balances = await api.getBalance(CASPER_DUMMY_ADDRESS);

      expect(balances).toEqual([{ value: 0n, asset: { type: "native" } }]);
    });
  });
});
