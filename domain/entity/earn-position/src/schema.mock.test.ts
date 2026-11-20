import { EarnPositionSchema, EarnPositionsSchema } from "./schema";
import { mockEarnPosition, mockEarnPositions } from "./schema.mock";

describe("mockEarnPosition", () => {
  it("returns a valid position", () => {
    expect(EarnPositionSchema.safeParse(mockEarnPosition()).success).toBe(true);
  });

  it("honors overrides", () => {
    const position = mockEarnPosition({ status: "deactivated", validatorName: undefined });

    expect(position.status).toBe("deactivated");
    expect(position.validatorName).toBeUndefined();
  });

  it("keeps the balance equal to the deposit plus the rewards", () => {
    const { balance, deposited, totalRewards } = mockEarnPosition();

    expect(BigInt(balance ?? "")).toBe(BigInt(deposited ?? "") + BigInt(totalRewards ?? ""));
  });
});

describe("mockEarnPositions", () => {
  it("returns valid positions", () => {
    expect(EarnPositionsSchema.safeParse(mockEarnPositions()).success).toBe(true);
  });

  it("honors overrides", () => {
    const result = mockEarnPositions({
      positions: [],
      failures: [{ code: 503, reason: "Provider unavailable" }],
    });

    expect(result.positions).toEqual([]);
    expect(result.failures).toEqual([{ code: 503, reason: "Provider unavailable" }]);
  });
});
