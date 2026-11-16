import { resolvePositionMatch } from "./resolvePositionMatch";

const TARGET = { positionId: "stake-account-a", validatorAddress: "validator-1" };

describe("resolvePositionMatch", () => {
  it("should match the only position of the target validator when it is the target", () => {
    const candidates = [
      TARGET,
      { positionId: "stake-account-b", validatorAddress: "validator-2" },
      { positionId: "stake-account-c", validatorAddress: "validator-3" },
    ];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "match" });
  });

  it("should be ambiguous when two positions share the target validator", () => {
    const candidates = [TARGET, { positionId: "stake-account-b", validatorAddress: "validator-1" }];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "ambiguous" });
  });

  it("should be ambiguous when the target validator has two positions other than the target", () => {
    const candidates = [
      { positionId: "stake-account-b", validatorAddress: "validator-1" },
      { positionId: "stake-account-c", validatorAddress: "validator-1" },
    ];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "ambiguous" });
  });

  it("should not find a position id the account does not hold", () => {
    const candidates = [{ positionId: "stake-account-b", validatorAddress: "validator-2" }];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "notFound" });
  });

  it("should not find a position id that is delegated to another validator", () => {
    const candidates = [{ positionId: "stake-account-a", validatorAddress: "validator-2" }];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "notFound" });
  });

  it("should not find the target when the only position of its validator is another one", () => {
    const candidates = [{ positionId: "stake-account-b", validatorAddress: "validator-1" }];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "notFound" });
  });

  it("should not find anything in an account without positions", () => {
    expect(resolvePositionMatch([], TARGET)).toEqual({ kind: "notFound" });
  });
});
