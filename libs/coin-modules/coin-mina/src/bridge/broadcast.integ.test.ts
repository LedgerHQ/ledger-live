import Client from "mina-signer";
import { setCoinConfig } from "../config";
import { signatureJsonToHex } from "../test/fixtures";
import broadcast from "./broadcast";
import { TxType } from "../types/common";

describe("Broadcast", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: { type: "active" },
      infra: {
        API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
        API_MINA_GRAPHQL_NODE: "https://mina.coin.ledger.com/node/graphql",
        API_VALIDATORS_BASE_URL: "https://mina.coin.ledger.com/node/validators",
      },
    }));
  });

  it("throws when broadcasting a transaction with an invalid signature", async () => {
    const signedTx = JSON.stringify({
      signature:
        "3b8b17cb9cf9a65cef39d91d7678ad0f1a84c153079bc0a5a18931717c19bb76f308c9ae1891e423fb5a1fd5ba56a5a886aafb0fd720a20cb2d1c1d374507920",
      transaction: {
        txType: TxType.PAYMENT,
        senderAccount: 0,
        senderAddress: "B62qjWLs1W3J2fFGixeX49w1o7VvSGuMBNotnFhzs3PZ7PbtdFbhdeD",
        receiverAddress: "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314",
        amount: 1000000000,
        fee: 10000000,
        nonce: 0,
        memo: "",
        networkId: 1,
      },
    });

    await expect(
      broadcast({
        signedOperation: {
          signature: signedTx,
          operation: { id: "integ", hash: "", extra: {} },
        },
      } as any),
    ).rejects.toThrow("Can't send transaction: Nonce invalid");
  });

  it("throws when broadcasting a properly signed transaction from an unfunded account", async () => {
    const client = new Client({ network: "mainnet" });
    const keypair = client.genKeys();

    const signed = client.signPayment(
      {
        from: keypair.publicKey,
        to: keypair.publicKey,
        amount: 1000000000,
        fee: 10000000,
        nonce: 0,
        memo: "",
      },
      keypair.privateKey,
    );

    const signedTx = JSON.stringify({
      signature: signatureJsonToHex(signed.signature),
      transaction: {
        txType: TxType.PAYMENT,
        senderAccount: 0,
        senderAddress: keypair.publicKey,
        receiverAddress: keypair.publicKey,
        amount: 1000000000,
        fee: 10000000,
        nonce: 0,
        memo: "",
        networkId: 1,
      },
    });

    await expect(
      broadcast({
        signedOperation: {
          signature: signedTx,
          operation: { id: "integ", hash: "", extra: {} },
        },
      } as any),
    ).rejects.toThrow("Can't send transaction: No sender found in ledger");
  });
});
