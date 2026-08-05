import { CasperNetwork, KeyAlgorithm, PrivateKey, Transaction } from "casper-js-sdk";
import { getMockedConfig } from "../__tests__/fixtures";
import { CASPER_DEFAULT_TTL, CASPER_FEES_MOTES, CASPER_NETWORK } from "../constants";
import { getCasperNodeRpcClient } from "../network/api";
import { createApi } from "./index";

describe("createApi (integration)", () => {
  const api = createApi(() => getMockedConfig());

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
});
