import { FAMILIES, TronTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import BigNumber from "bignumber.js";
import tron from "./platformAdapter";

const platformTx = (extra: Partial<PlatformTransaction> = {}): PlatformTransaction => ({
  family: FAMILIES.TRON,
  mode: "send",
  amount: new BigNumber(1000000),
  recipient: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
  ...extra,
});

describe("tron getPlatformTransactionSignFlowInfos", () => {
  it("passes a plain send through with no familySpecificData", () => {
    const { canEditFees, hasFeesProvided, liveTx } =
      tron.getPlatformTransactionSignFlowInfos(platformTx());

    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual({
      family: "tron",
      mode: "send",
      amount: new BigNumber(1000000),
      recipient: "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
    });
  });

  it("moves resource and duration into familySpecificData", () => {
    const { liveTx } = tron.getPlatformTransactionSignFlowInfos(
      platformTx({ mode: "freeze", resource: "ENERGY", duration: 3 }),
    );

    expect(liveTx.familySpecificData).toEqual({ resource: "ENERGY", duration: 3 });
    expect(liveTx).not.toHaveProperty("resource");
    expect(liveTx).not.toHaveProperty("duration");
  });
});
