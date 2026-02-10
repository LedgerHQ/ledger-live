import BigNumber from "bignumber.js";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { craftTransaction } from "./craftTransaction";

describe("craftTransaction", () => {
  const SENDER = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";
  const RECIPIENT = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";

  it("crafts a simple transfer transaction", async () => {
    const result = await craftTransaction(
      { address: SENDER, nextSequenceNumber: 1 },
      { recipient: RECIPIENT, amount: new BigNumber(1_000_000) },
    );

    expect(result).toBeDefined();
    expect(result.type).toBe(TransactionType.Transfer);
    expect(result.header).toBeDefined();
    expect(result.header.sender.address).toBe(SENDER);
    expect(result.header.nonce).toBe(BigInt(1));
    expect(result.header.expiry).toBeGreaterThan(BigInt(0));
    expect(result.payload).toBeDefined();
    expect(result.payload.amount).toBe(BigInt(1_000_000));
    expect(result.payload.toAddress.address).toBe(RECIPIENT);
  });

  it("crafts a transfer with memo transaction", async () => {
    const result = await craftTransaction(
      { address: SENDER, nextSequenceNumber: 5 },
      { recipient: RECIPIENT, amount: new BigNumber(2_000_000), memo: "test memo" },
    );

    expect(result).toBeDefined();
    expect(result.type).toBe(TransactionType.TransferWithMemo);
    expect(result.header.sender.address).toBe(SENDER);
    expect(result.header.nonce).toBe(BigInt(5));
    expect(result.payload.amount).toBe(BigInt(2_000_000));
    expect(result.payload.toAddress.address).toBe(RECIPIENT);
    expect(result.payload.memo).toBeDefined();
    expect(result.payload.memo).toBeInstanceOf(Buffer);
  });

  it("sets expiry to approximately 1 hour from now", async () => {
    const beforeTime = Math.floor(Date.now() / 1000);
    const result = await craftTransaction(
      { address: SENDER, nextSequenceNumber: 1 },
      { recipient: RECIPIENT, amount: new BigNumber(1_000_000) },
    );
    const afterTime = Math.floor(Date.now() / 1000);

    const expiry = Number(result.header.expiry);
    // Expiry should be within 1 hour (3600 seconds) from now
    expect(expiry).toBeGreaterThanOrEqual(beforeTime + 3600);
    expect(expiry).toBeLessThanOrEqual(afterTime + 3600);
  });

  it("uses default nonce 0 when nextSequenceNumber is not provided", async () => {
    const result = await craftTransaction(
      { address: SENDER },
      { recipient: RECIPIENT, amount: new BigNumber(500_000) },
    );

    expect(result.header.nonce).toBe(BigInt(0));
  });

  it("includes energy amount when provided", async () => {
    const energy = BigInt(600);
    const result = await craftTransaction(
      { address: SENDER, nextSequenceNumber: 1 },
      { recipient: RECIPIENT, amount: new BigNumber(1_000_000), energy },
    );

    expect(result.header.energyAmount).toBe(energy);
  });
});
