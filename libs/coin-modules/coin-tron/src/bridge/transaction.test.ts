import BigNumber from "bignumber.js";
import type { EnergyProviderInfo, TransactionStatusRaw } from "../types";
import createTransaction from "./createTransaction";
import { fromTransactionRaw, fromTransactionStatusRaw, toTransactionRaw } from "./transaction";

describe("fromTransactionStatusRaw", () => {
  it("defaults the live-derived resource fields to 0 (they are not persisted in Raw)", () => {
    const raw = {
      errors: {},
      warnings: {},
      estimatedFees: "0",
      amount: "0",
      totalSpent: "0",
    } as unknown as TransactionStatusRaw;

    const status = fromTransactionStatusRaw(raw);

    expect(status.energyRequired).toEqual(new BigNumber(0));
    expect(status.energyAvailable).toEqual(new BigNumber(0));
    expect(status.bandwidthRequired).toEqual(new BigNumber(0));
    expect(status.bandwidthAvailable).toEqual(new BigNumber(0));
  });
});

// LIVE-32775: the sponsoring context must survive the Transaction <-> TransactionRaw boundary
// (the Send flow sets it, then the tx is serialized to reach the signer), and stay absent otherwise.
describe("energyProviderInfo serialization (LIVE-32775)", () => {
  const energyProviderInfo: EnergyProviderInfo = { providerId: "tronify", orderId: "order-123" };

  it("round-trips the sponsoring context through toTransactionRaw / fromTransactionRaw", () => {
    const tx = { ...createTransaction(), energyProviderInfo };

    const raw = toTransactionRaw(tx);
    expect(raw.energyProviderInfo).toEqual(energyProviderInfo);

    expect(fromTransactionRaw(raw).energyProviderInfo).toEqual(energyProviderInfo);
  });

  it("keeps it undefined when absent (standard crafting)", () => {
    const raw = toTransactionRaw(createTransaction());
    expect(raw.energyProviderInfo).toBeUndefined();
    expect(fromTransactionRaw(raw).energyProviderInfo).toBeUndefined();
  });
});
