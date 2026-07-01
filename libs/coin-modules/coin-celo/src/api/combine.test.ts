import { parseTransaction, serializeTransaction } from "viem/celo";
import { combine } from "./combine";

const RECIPIENT = "0x1234567890123456789012345678901234567890";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";

const baseTx = {
  chainId: 42220,
  nonce: 1,
  to: RECIPIENT as `0x${string}`,
  value: 5n,
  gas: 84000n,
  maxFeePerGas: 1000n,
  maxPriorityFeePerGas: 100n,
  data: "0x" as `0x${string}`,
};

const unsignedEip1559 = serializeTransaction({ ...baseTx, type: "eip1559" });
const unsignedCip64 = serializeTransaction({
  ...baseTx,
  type: "cip64",
  feeCurrency: USDC_ADAPTER,
});

const R = `0x${"11".repeat(32)}`;
const S = `0x${"22".repeat(32)}`;

describe("combine", () => {
  it("attaches a {r,s,v} signature to an eip1559 tx and preserves its fields", () => {
    const signed = combine(unsignedEip1559, { r: R, s: S, v: 27 });
    const tx = parseTransaction(signed as `0x${string}`);

    expect(tx.type).toBe("eip1559");
    expect(tx.to?.toLowerCase()).toBe(RECIPIENT.toLowerCase());
    expect(tx.value).toBe(5n);
    expect(tx.r).toBe(R);
    expect(tx.s).toBe(S);
  });

  it("attaches a signature to a cip64 tx and preserves the fee currency", () => {
    const signed = combine(unsignedCip64, { r: R, s: S, v: 28 });
    const tx = parseTransaction(signed as `0x${string}`);

    expect(tx.type).toBe("cip64");
    expect((tx as { feeCurrency?: string }).feeCurrency?.toLowerCase()).toBe(
      USDC_ADAPTER.toLowerCase(),
    );
  });

  it("accepts unprefixed r/s and a hex string v (DMK device shape)", () => {
    const signed = combine(unsignedEip1559, { r: "11".repeat(32), s: "22".repeat(32), v: "1b" });
    const tx = parseTransaction(signed as `0x${string}`);

    expect(tx.r).toBe(R);
  });

  it("accepts a concatenated r||s||v hex string signature", () => {
    const sigHex = `0x${"11".repeat(32)}${"22".repeat(32)}1b`;
    const signed = combine(unsignedEip1559, sigHex);
    const tx = parseTransaction(signed as `0x${string}`);

    expect(tx.r).toBe(R);
  });

  it("throws on an unsupported v value", () => {
    expect(() => combine(unsignedEip1559, { r: R, s: S, v: 5 })).toThrow(/unsupported signature/);
  });
});
