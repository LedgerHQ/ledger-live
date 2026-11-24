import { types as TyphonTypes } from "@stricahq/typhonjs";
import { formatDRepId, parseDRepId, toTyphonDRep } from "./drep";
import { CardanoInvalidDRepId } from "./errors";

const CIP_129_VECTORS = [
  {
    type: "key" as const,
    hash: "00000000000000000000000000000000000000000000000000000000",
    id: "drep1ygqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq7vlc9n",
  },
  {
    type: "script" as const,
    hash: "00000000000000000000000000000000000000000000000000000000",
    id: "drep_script1yvqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqhv4syj",
  },
];

describe("DRep IDs", () => {
  it.each(CIP_129_VECTORS)("should parse and format the CIP-129 $type vector", vector => {
    const drep = parseDRepId(vector.id);

    expect(drep).toEqual({ type: vector.type, hash: Buffer.from(vector.hash, "hex") });
    expect(formatDRepId(drep)).toBe(vector.id);
  });

  it("should reject legacy CIP-105 DRep IDs because scripts cannot be represented", () => {
    expect(() =>
      parseDRepId("drep1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq9t7e8e"),
    ).toThrow(CardanoInvalidDRepId);
  });

  it("should convert all explicit vote targets to Typhon DReps", () => {
    expect(toTyphonDRep({ type: "drep", drepId: CIP_129_VECTORS[1].id })).toEqual({
      type: TyphonTypes.DRepType.SCRIPT,
      key: Buffer.alloc(28),
    });
    expect(toTyphonDRep({ type: "alwaysAbstain" })).toEqual({
      type: TyphonTypes.DRepType.ABSTAIN,
      key: undefined,
    });
    expect(toTyphonDRep({ type: "alwaysNoConfidence" })).toEqual({
      type: TyphonTypes.DRepType.NO_CONFIDENCE,
      key: undefined,
    });
  });
});
