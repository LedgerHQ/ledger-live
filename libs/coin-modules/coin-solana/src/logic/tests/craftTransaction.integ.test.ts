import { VersionedTransaction } from "@solana/web3.js";
import { getChainAPI } from "../../network";
import { craftTransaction } from "../craftTransaction";

const api = getChainAPI({ endpoint: "https://solana.coin.ledger.com" });

const SENDER = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";
const RECIPIENT = "HYe4vSaEGqQKnDrxWDrk3o5H2gznv7qtij5G6NNG8WHd";

describe("craftTransaction (integration)", () => {
  it("crafts a valid native transfer transaction", async () => {
    const result = await craftTransaction(api, {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1_000_000n,
      asset: { type: "native" },
    });

    expect(typeof result.transaction).toBe("string");
    expect(result.transaction.length).toBeGreaterThan(0);

    const tx = VersionedTransaction.deserialize(Buffer.from(result.transaction, "base64"));
    expect(tx.message.staticAccountKeys.length).toBeGreaterThan(0);

    expect(typeof result.details?.recentBlockhash).toBe("string");
    expect(typeof result.details?.lastValidBlockHeight).toBe("number");
    expect(typeof result.details?.estimatedFee).toBe("string");
  });

  it("uses custom fees when provided", async () => {
    const customFee = 10_000n;
    const result = await craftTransaction(
      api,
      {
        intentType: "transaction",
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: 1_000_000n,
        asset: { type: "native" },
      },
      { value: customFee },
    );

    expect(result.details?.estimatedFee).toBe(customFee.toString());
  });

  it("crafts a transaction with a memo", async () => {
    const result = await craftTransaction(api, {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1_000_000n,
      asset: { type: "native" },
      memo: "integration test memo",
    } as any);

    expect(typeof result.transaction).toBe("string");
    const tx = VersionedTransaction.deserialize(Buffer.from(result.transaction, "base64"));
    expect(tx.message.staticAccountKeys.length).toBeGreaterThan(2);
  });
});
