import { BigNumber } from "bignumber.js";
import { fees } from "./fees";

const feePerByteInput = fees.custom?.inputs.find(input => input.key === "feePerByte");

describe("bitcoin fee descriptor - feePerByte minValue", () => {
  it("returns the relay fee floor from networkInfo when present", () => {
    const transaction = {
      networkInfo: { relayFeePerByte: new BigNumber(3) },
    };
    expect(feePerByteInput?.minValue?.getValue(transaction)).toBe("3");
  });

  it("returns null when networkInfo has no relay fee (no floor enforced)", () => {
    const transaction = { networkInfo: { feeItems: { items: [] } } };
    expect(feePerByteInput?.minValue?.getValue(transaction)).toBeNull();
  });

  it("returns null when relayFeePerByte is 0 (no misleading minimum)", () => {
    const transaction = { networkInfo: { relayFeePerByte: new BigNumber(0) } };
    expect(feePerByteInput?.minValue?.getValue(transaction)).toBeNull();
  });

  it("returns null when networkInfo is missing", () => {
    expect(feePerByteInput?.minValue?.getValue({})).toBeNull();
  });

  it("returns null for a non-record transaction", () => {
    expect(feePerByteInput?.minValue?.getValue(undefined)).toBeNull();
  });
});
