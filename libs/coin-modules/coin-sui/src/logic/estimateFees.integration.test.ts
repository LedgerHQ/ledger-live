import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { getFullnodeUrl } from "@mysten/sui/client";
import coinConfig from "../config";
import { estimateFees } from "./estimateFees";

const SENDER = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
const RECIPIENT = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

describe("estimateFees", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: getFullnodeUrl("mainnet"),
      },
    }));
  });

  it("should estimate fees for native SUI transaction", async () => {
    const transactionIntent: TransactionIntent = {
      intentType: "transaction",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: BigInt(1000),
      type: "send",
      asset: { type: "native" },
    };

    const estimatedFees = await estimateFees(transactionIntent);

    expect(typeof estimatedFees).toBe("bigint");
    expect(estimatedFees).toBeGreaterThan(1000n);
    expect(estimatedFees).toBeLessThan(10000000n);
  }, 25000);

  it("should estimate fees for token transaction", async () => {
    const coinType =
      "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT";

    const transactionIntent: TransactionIntent = {
      intentType: "transaction",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: BigInt(1000),
      type: "send",
      asset: {
        type: "token",
        assetReference: coinType,
      },
    };

    const estimatedFees = await estimateFees(transactionIntent);

    expect(typeof estimatedFees).toBe("bigint");
    expect(estimatedFees).toBeGreaterThan(1000n);
    expect(estimatedFees).toBeLessThan(10000000n);
  }, 25000);

  it("should handle concurrent fee estimations", async () => {
    const transactionIntent: TransactionIntent = {
      intentType: "transaction",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: BigInt(1000),
      type: "send",
      asset: { type: "native" },
    };

    // Run multiple concurrent estimations
    const promises = Array(5)
      .fill(0)
      .map(() => estimateFees(transactionIntent));
    const results = await Promise.all(promises);

    // All results should be valid
    results.forEach(fees => {
      expect(typeof fees).toBe("bigint");
      expect(fees).toBeGreaterThan(1000n);
      expect(fees).toBeLessThan(10000000n);
    });

    // Results should be similar (may have slight variations)
    const values = results.map(r => Number(r));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Should not vary by more than 50% under concurrent load
    expect((maxValue - minValue) / minValue).toBeLessThan(0.5);
  }, 25000);
});
