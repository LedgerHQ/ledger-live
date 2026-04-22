import {
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
  Asset,
  Account,
} from "@stellar/stellar-sdk";
import { broadcast } from "./broadcast";
import coinConfig from "../config";
import { StellarBroadcastFailedError } from "../types";

describe("Broadcast", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      explorer: {
        url: "https://stellar.coin.ledger.com",
      },
    }));
  });

  it("throws on insufficient funds", async () => {
    const source = Keypair.random();
    const account = new Account(source.publicKey(), "0");

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.PUBLIC,
    })
      .addOperation(
        Operation.payment({
          destination: source.publicKey(),
          asset: Asset.native(),
          amount: "1",
        }),
      )
      .setTimeout(0)
      .build();
    tx.sign(source);

    await expect(broadcast(tx.toXDR())).rejects.toThrow(StellarBroadcastFailedError);
  });
});
