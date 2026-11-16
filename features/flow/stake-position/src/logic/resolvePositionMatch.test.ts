import { resolvePositionMatch } from "./resolvePositionMatch";

const TARGET = { positionId: "stake-account-a", validatorAddress: "validator-1" };

const undelegated = (positionId: string) => ({ positionId, validatorAddress: "" });

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

  it("should not count positions without a validator as sharing the target validator", () => {
    const candidates = [TARGET, undelegated("stake-account-b"), undelegated("stake-account-c")];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "match" });
  });

  it("should not find a position id the account does not hold", () => {
    const candidates = [{ positionId: "stake-account-b", validatorAddress: "validator-2" }];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "notFound" });
  });

  it("should not find a position id that is delegated to another validator", () => {
    const candidates = [{ positionId: "stake-account-a", validatorAddress: "validator-2" }];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "notFound" });
  });

  it("should not find a target validator for a position id that has no validator", () => {
    const candidates = [undelegated("stake-account-a")];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "notFound" });
  });

  it("should not find the target when the only position of its validator is another one", () => {
    const candidates = [{ positionId: "stake-account-b", validatorAddress: "validator-1" }];

    expect(resolvePositionMatch(candidates, TARGET)).toEqual({ kind: "notFound" });
  });

  it("should not find anything in an account without positions", () => {
    expect(resolvePositionMatch([], TARGET)).toEqual({ kind: "notFound" });
  });

  describe("when the target has no validator", () => {
    it("should match the undelegated position by its id", () => {
      const candidates = [TARGET, undelegated("stake-account-u")];

      expect(resolvePositionMatch(candidates, undelegated("stake-account-u"))).toEqual({
        kind: "match",
      });
    });

    it.each(["stake-account-u1", "stake-account-u2", "stake-account-u3"])(
      "should match %s by its own id among several undelegated positions",
      positionId => {
        const candidates = [
          TARGET,
          undelegated("stake-account-u1"),
          undelegated("stake-account-u2"),
          undelegated("stake-account-u3"),
        ];

        expect(resolvePositionMatch(candidates, undelegated(positionId))).toEqual({
          kind: "match",
        });
      },
    );

    it("should not find a position the account delegates to a validator", () => {
      expect(resolvePositionMatch([TARGET], undelegated(TARGET.positionId))).toEqual({
        kind: "notFound",
      });
    });

    it("should not find a position id the account does not hold among undelegated positions", () => {
      const candidates = [undelegated("stake-account-u1"), undelegated("stake-account-u2")];

      expect(resolvePositionMatch(candidates, undelegated("stake-account-x"))).toEqual({
        kind: "notFound",
      });
    });

    it("should not find anything in an account without positions", () => {
      expect(resolvePositionMatch([], undelegated("stake-account-u"))).toEqual({
        kind: "notFound",
      });
    });
  });
});
