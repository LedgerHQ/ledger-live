import { deduceFees } from "./utils";
import { BalanceDelta } from "./types";

const nativeAsset = { type: "native" as const };
const tokenAsset = { type: "token", assetReference: "0x123" };

describe("deduceFees", () => {
  it("should return empty array when both deltas and fees are empty", () => {
    const result = deduceFees([], []);
    expect(result).toEqual([]);
  });

  it("should return deltas unchanged when fees array is empty", () => {
    const deltas: BalanceDelta[] = [
      { address: "addr1", asset: nativeAsset, delta: 100n },
      { address: "addr2", asset: nativeAsset, delta: -50n },
    ];
    const result = deduceFees(deltas, []);
    expect(result).toEqual(deltas);
  });

  it("should deduct a single fee from matching delta", () => {
    const deltas: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: -100n }];
    const fees: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: -10n }];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([{ address: "addr1", asset: nativeAsset, delta: -90n }]);
  });

  it("should deduct fees from multiple matching deltas", () => {
    const deltas: BalanceDelta[] = [
      { address: "addr1", asset: nativeAsset, delta: -100n },
      { address: "addr2", asset: nativeAsset, delta: 50n },
    ];
    const fees: BalanceDelta[] = [
      { address: "addr1", asset: nativeAsset, delta: -10n },
      { address: "addr2", asset: nativeAsset, delta: 5n },
    ];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([
      { address: "addr1", asset: nativeAsset, delta: -90n },
      { address: "addr2", asset: nativeAsset, delta: 45n },
    ]);
  });

  it("should keep deltas unchanged when no matching fees", () => {
    const deltas: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: -100n }];
    const fees: BalanceDelta[] = [{ address: "addr2", asset: nativeAsset, delta: -10n }];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([{ address: "addr1", asset: nativeAsset, delta: -100n }]);
  });

  it("should handle mixed case with some matching and some non-matching fees", () => {
    const deltas: BalanceDelta[] = [
      { address: "addr1", asset: nativeAsset, delta: -100n },
      { address: "addr2", asset: nativeAsset, delta: 50n },
      { address: "addr3", asset: nativeAsset, delta: 25n },
    ];
    const fees: BalanceDelta[] = [
      { address: "addr1", asset: nativeAsset, delta: -10n },
      { address: "addr3", asset: nativeAsset, delta: 5n },
    ];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([
      { address: "addr1", asset: nativeAsset, delta: -90n },
      { address: "addr2", asset: nativeAsset, delta: 50n },
      { address: "addr3", asset: nativeAsset, delta: 20n },
    ]);
  });

  it("should match fees by both address and asset", () => {
    const deltas: BalanceDelta[] = [
      { address: "addr1", asset: nativeAsset, delta: -100n },
      { address: "addr1", asset: tokenAsset, delta: -200n },
    ];
    const fees: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: -10n }];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([
      { address: "addr1", asset: nativeAsset, delta: -90n },
      { address: "addr1", asset: tokenAsset, delta: -200n },
    ]);
  });

  it("should handle multiple assets correctly", () => {
    const deltas: BalanceDelta[] = [
      { address: "addr1", asset: nativeAsset, delta: -100n },
      { address: "addr2", asset: tokenAsset, delta: 50n },
    ];
    const fees: BalanceDelta[] = [
      { address: "addr1", asset: nativeAsset, delta: -10n },
      { address: "addr2", asset: tokenAsset, delta: 5n },
    ];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([
      { address: "addr1", asset: nativeAsset, delta: -90n },
      { address: "addr2", asset: tokenAsset, delta: 45n },
    ]);
  });

  it("should preserve peer property when present", () => {
    const deltas: BalanceDelta[] = [
      { address: "addr1", peer: "peer1", asset: nativeAsset, delta: -100n },
    ];
    const fees: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: -10n }];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([{ address: "addr1", peer: "peer1", asset: nativeAsset, delta: -90n }]);
  });

  it("should handle zero delta correctly", () => {
    const deltas: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: 0n }];
    const fees: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: 0n }];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([{ address: "addr1", asset: nativeAsset, delta: 0n }]);
  });

  it("should handle positive fee values (edge case)", () => {
    const deltas: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: 100n }];
    const fees: BalanceDelta[] = [{ address: "addr1", asset: nativeAsset, delta: 10n }];
    const result = deduceFees(deltas, fees);
    expect(result).toEqual([{ address: "addr1", asset: nativeAsset, delta: 90n }]);
  });
});
