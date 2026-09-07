import { BigNumber } from "bignumber.js";
import { descriptor } from "./index";

const getNetworkFeesInfo = descriptor.send.fees.getNetworkFeesInfo;

/**
 * The resource amounts arrive on the *transaction*, propagated from `FeeEstimation.parameters` onto
 * `feeParameters` by the generic `prepareTransaction` — the status carries no Tron-specific fields.
 */
const networkFeesInfoFor = (fields: {
  estimatedFees: number;
  energyRequired?: string;
  bandwidthRequired?: string;
  errors?: Record<string, unknown>;
}) =>
  getNetworkFeesInfo?.({
    transaction: {
      feeParameters: {
        ...(fields.energyRequired !== undefined ? { energyRequired: fields.energyRequired } : {}),
        ...(fields.bandwidthRequired !== undefined
          ? { bandwidthRequired: fields.bandwidthRequired }
          : {}),
      },
    },
    status: {
      estimatedFees: new BigNumber(fields.estimatedFees),
      errors: fields.errors ?? {},
      warnings: {},
    },
  });

describe("tron descriptor", () => {
  // Tron fees are not editable, which is what makes the fee row show both the fiat and the TRX
  // amount. Guard that so a future preset/custom-fee opt-in does not silently drop the TRX amount.
  it("declares no editable fees", () => {
    expect(descriptor.send.fees.hasPresets).toBe(false);
    expect(descriptor.send.fees.hasCustom).toBe(false);
    expect(descriptor.send.fees.hasCoinControl).toBeUndefined();
  });
});

describe("tron descriptor - getNetworkFeesInfo", () => {
  it("is exposed on the tron fee descriptor", () => {
    expect(typeof getNetworkFeesInfo).toBe("function");
  });

  it("zero fee → sufficient, values are the amounts the transfer uses", () => {
    expect(
      networkFeesInfoFor({ estimatedFees: 0, energyRequired: "50000", bandwidthRequired: "345" }),
    ).toEqual({
      translationKey: "tronFees.sufficient",
      values: { energy: "50000", bandwidth: "345" },
    });
  });

  it("non-zero fee → insufficient", () => {
    expect(
      networkFeesInfoFor({
        estimatedFees: 13_740_900,
        energyRequired: "65000",
        bandwidthRequired: "345",
      })?.translationKey,
    ).toBe("tronFees.insufficient");
  });

  it("ample resources but a non-zero fee (inactive-recipient TRC20) → insufficient, not sufficient", () => {
    expect(
      networkFeesInfoFor({
        estimatedFees: 13_740_900,
        energyRequired: "50000",
        bandwidthRequired: "345",
      })?.translationKey,
    ).toBe("tronFees.insufficient");
  });

  it("native TRX / TRC10 covered (zero fee, zero energy) → sufficient", () => {
    const info = networkFeesInfoFor({
      estimatedFees: 0,
      energyRequired: "0",
      bandwidthRequired: "270",
    });

    expect(info?.translationKey).toBe("tronFees.sufficient");
    expect(info?.values).toEqual({ energy: "0", bandwidth: "270" });
  });

  it("native TRX / TRC10 with a bandwidth fee (non-zero) → insufficient", () => {
    expect(
      networkFeesInfoFor({ estimatedFees: 270_000, energyRequired: "0", bandwidthRequired: "270" })
        ?.translationKey,
    ).toBe("tronFees.insufficient");
  });

  it("returns null when the TRON breakdown fields are absent", () => {
    expect(networkFeesInfoFor({ estimatedFees: 0 })).toBeNull();
    expect(
      getNetworkFeesInfo?.({ transaction: {}, status: { estimatedFees: new BigNumber(0) } }),
    ).toBeNull();
  });

  it("returns null when the transaction is null/undefined", () => {
    const status = { estimatedFees: new BigNumber(0), errors: {}, warnings: {} };

    expect(getNetworkFeesInfo?.({ transaction: null, status })).toBeNull();
    expect(getNetworkFeesInfo?.({ transaction: undefined, status })).toBeNull();
  });

  it("returns null when status is null/undefined", () => {
    expect(getNetworkFeesInfo?.({ transaction: {}, status: null })).toBeNull();
    expect(getNetworkFeesInfo?.({ transaction: {}, status: undefined })).toBeNull();
  });

  it("returns null when the fee is non-finite (unknown, matches the fee row)", () => {
    expect(
      networkFeesInfoFor({ estimatedFees: NaN, energyRequired: "0", bandwidthRequired: "0" }),
    ).toBeNull();
  });

  it("returns null when a resource amount is not a finite number", () => {
    expect(
      networkFeesInfoFor({
        estimatedFees: 0,
        energyRequired: "not-a-number",
        bandwidthRequired: "270",
      }),
    ).toBeNull();
  });

  it("returns null for a zero fee while the transaction has errors (unknown, not covered)", () => {
    expect(
      networkFeesInfoFor({
        estimatedFees: 0,
        energyRequired: "0",
        bandwidthRequired: "0",
        errors: { recipient: new Error("bad") },
      }),
    ).toBeNull();
  });
});
