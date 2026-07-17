import { BigNumber } from "bignumber.js";
import { descriptor } from "./index";

const getNetworkFeesInfo = descriptor.send.fees.getNetworkFeesInfo;

const status = (fields: {
  estimatedFees: number;
  energyRequired: number;
  bandwidthRequired: number;
  energyAvailable?: number;
  bandwidthAvailable?: number;
}) => ({
  estimatedFees: new BigNumber(fields.estimatedFees),
  energyRequired: new BigNumber(fields.energyRequired),
  bandwidthRequired: new BigNumber(fields.bandwidthRequired),
  energyAvailable: new BigNumber(fields.energyAvailable ?? 0),
  bandwidthAvailable: new BigNumber(fields.bandwidthAvailable ?? 0),
});

describe("tron descriptor", () => {
  it("opts into showing the fee-currency amount on the fee row", () => {
    expect(descriptor.send.fees.showFeeCurrencyAmount).toBe(true);
  });
});

describe("tron descriptor - getNetworkFeesInfo", () => {
  it("is exposed on the tron fee descriptor", () => {
    expect(typeof getNetworkFeesInfo).toBe("function");
  });

  it("zero fee → sufficient, values are the amounts the transfer uses", () => {
    const info = getNetworkFeesInfo?.({
      transaction: {},
      status: status({ estimatedFees: 0, energyRequired: 50_000, bandwidthRequired: 345 }),
    });
    expect(info).toEqual({
      translationKey: "tronFees.sufficient",
      values: { energy: "50000", bandwidth: "345" },
    });
  });

  it("non-zero fee → insufficient", () => {
    const info = getNetworkFeesInfo?.({
      transaction: {},
      status: status({ estimatedFees: 13_740_900, energyRequired: 65_000, bandwidthRequired: 345 }),
    });
    expect(info?.translationKey).toBe("tronFees.insufficient");
  });

  it("ample resources but a non-zero fee (inactive-recipient TRC20) → insufficient, not sufficient", () => {
    const info = getNetworkFeesInfo?.({
      transaction: {},
      status: status({
        estimatedFees: 13_740_900,
        energyRequired: 50_000,
        energyAvailable: 999_999,
        bandwidthRequired: 345,
        bandwidthAvailable: 999_999,
      }),
    });
    expect(info?.translationKey).toBe("tronFees.insufficient");
  });

  it("native TRX / TRC10 covered (zero fee, zero energy) → sufficient", () => {
    const info = getNetworkFeesInfo?.({
      transaction: {},
      status: status({ estimatedFees: 0, energyRequired: 0, bandwidthRequired: 270 }),
    });
    expect(info?.translationKey).toBe("tronFees.sufficient");
    expect(info?.values).toEqual({ energy: "0", bandwidth: "270" });
  });

  it("native TRX / TRC10 with a bandwidth fee (non-zero) → insufficient", () => {
    const info = getNetworkFeesInfo?.({
      transaction: {},
      status: status({ estimatedFees: 270_000, energyRequired: 0, bandwidthRequired: 270 }),
    });
    expect(info?.translationKey).toBe("tronFees.insufficient");
  });

  it("returns null when the TRON breakdown fields are absent", () => {
    expect(
      getNetworkFeesInfo?.({
        transaction: {},
        status: { errors: {}, warnings: {}, estimatedFees: new BigNumber(0) },
      }),
    ).toBeNull();
  });

  it("returns null when status is null/undefined", () => {
    expect(getNetworkFeesInfo?.({ transaction: {}, status: null })).toBeNull();
    expect(getNetworkFeesInfo?.({ transaction: {}, status: undefined })).toBeNull();
  });

  it("returns null when a breakdown field is non-finite (unknown, matches the fee row)", () => {
    const info = getNetworkFeesInfo?.({
      transaction: {},
      status: status({ estimatedFees: NaN, energyRequired: 0, bandwidthRequired: 0 }),
    });
    expect(info).toBeNull();
  });

  it("returns null for a zero fee while the transaction has errors (unknown, not covered)", () => {
    const info = getNetworkFeesInfo?.({
      transaction: {},
      status: {
        ...status({ estimatedFees: 0, energyRequired: 0, bandwidthRequired: 0 }),
        errors: { recipient: new Error("bad") },
      },
    });
    expect(info).toBeNull();
  });
});
