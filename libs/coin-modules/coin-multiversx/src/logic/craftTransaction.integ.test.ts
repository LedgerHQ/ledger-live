import {
  CHAIN_ID,
  GAS,
  GAS_PRICE,
  MIN_GAS_LIMIT,
  TRANSACTION_OPTIONS_TX_HASH_SIGN,
  TRANSACTION_VERSION_DEFAULT,
} from "../constants";
import { combine } from "./combine";
import { craftTransaction } from "./craftTransaction";

const SENDER = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
const RECIPIENT = "erd1qqqqqqqqqqqqqpgqa0fsfshnff4n76jhcye6k7uvd7qacsq42jpsp6shh2";
const DELEGATION_CONTRACT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy";

describe("craftTransaction (integration)", () => {
  it("crafts a protocol-correct native EGLD transfer", () => {
    const amount = 1_000_000_000_000_000_000n;
    const { transaction } = craftTransaction({
      sender: SENDER,
      recipient: RECIPIENT,
      amount,
      nonce: 42,
      mode: "send",
    });

    const tx = JSON.parse(transaction);
    expect(tx).toMatchObject({
      nonce: 42,
      value: amount.toString(),
      receiver: RECIPIENT,
      sender: SENDER,
      gasPrice: GAS_PRICE,
      gasLimit: MIN_GAS_LIMIT,
      chainID: CHAIN_ID,
      version: TRANSACTION_VERSION_DEFAULT,
      options: TRANSACTION_OPTIONS_TX_HASH_SIGN,
    });
    expect(tx.data).toBeUndefined();
  });

  it("crafts a protocol-correct ESDT token transfer", () => {
    const { transaction } = craftTransaction({
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 5_000_000n,
      nonce: 7,
      mode: "send",
      tokenIdentifier: "USDC-c76f1f",
    });

    const tx = JSON.parse(transaction);
    expect(tx.value).toBe("0");
    expect(tx.gasLimit).toBe(GAS.ESDT_TRANSFER);
    const decoded = Buffer.from(tx.data, "base64").toString();
    expect(decoded).toMatch(/^ESDTTransfer@/);
  });

  it("crafts a protocol-correct delegate transaction", () => {
    const amount = 2_000_000_000_000_000_000n;
    const { transaction } = craftTransaction({
      sender: SENDER,
      recipient: DELEGATION_CONTRACT,
      amount,
      nonce: 3,
      mode: "delegate",
    });

    const tx = JSON.parse(transaction);
    expect(tx.value).toBe(amount.toString());
    expect(tx.gasLimit).toBe(GAS.DELEGATE);
    expect(Buffer.from(tx.data, "base64").toString()).toBe("delegate");
  });

  it("produces output that combine() can attach a signature to", () => {
    const { transaction } = craftTransaction({
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1n,
      nonce: 0,
      mode: "send",
    });

    const signature = "a".repeat(128);
    const signed = JSON.parse(combine(transaction, signature));

    expect(signed.signature).toBe(signature);
    expect(signed.sender).toBe(SENDER);
    expect(signed.receiver).toBe(RECIPIENT);
  });

  it("rejects an invalid sender address", () => {
    expect(() =>
      craftTransaction({
        sender: "not-an-address",
        recipient: RECIPIENT,
        amount: 1n,
        nonce: 0,
        mode: "send",
      }),
    ).toThrow(/invalid sender address/);
  });
});
