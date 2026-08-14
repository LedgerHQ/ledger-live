import { GENERIC_TRANSACTION_MODE } from "./generic-coin-framework/types";
import { MODE_TRAITS, RESOURCE_STAKING_OPERATION_TYPES } from "@ledgerhq/coin-tron/logic/modes";
import {
  deriveEarnTransactionType,
  deriveFromOperationType,
} from "@ledgerhq/transaction-observability";

/**
 * Drift guard for the earn funnel's staking vocabulary.
 *
 * `@ledgerhq/transaction-observability` classifies transactions by matching family-specific
 * wording, but it cannot import the coin layer — live-common depends on it, so the edge would
 * be a cycle. Its own tests therefore assert its maps against hardcoded expectations, which
 * proves they are self-consistent and nothing more: rename a mode upstream and those tests
 * still pass while production silently classifies nothing.
 *
 * This test closes that hole from the side that *can* see both. It reads the real, runtime
 * vocabularies and fails when one gains a value the classifier does not know — so a coin
 * module change surfaces here rather than as a hole in the funnel.
 *
 * Add a family here whenever it exposes its modes as runtime values (most declare them as
 * types only, which cannot be enumerated).
 */

// Modes that move funds rather than stake them. Listed explicitly so that adding a mode
// upstream fails the test until someone decides which side it belongs on.
const GENERIC_NON_STAKING = new Set(["send", "changeTrust", "send-legacy", "send-eip1559"]);
const TRON_NON_STAKING = new Set(["send"]);

describe("staking vocabulary drift", () => {
  describe("the generic coin framework", () => {
    it("classifies every staking mode it defines", () => {
      const unclassified = GENERIC_TRANSACTION_MODE.filter(
        mode =>
          !GENERIC_NON_STAKING.has(mode) &&
          deriveEarnTransactionType("newchain", mode) === undefined,
      );
      expect(unclassified).toEqual([]);
    });

    it("claims nothing for the modes that are not staking", () => {
      for (const mode of GENERIC_NON_STAKING) {
        expect(deriveEarnTransactionType("newchain", mode)).toBeUndefined();
      }
    });
  });

  // Tron is the family that has already migrated onto the generic framework while keeping its
  // own wording, so it is the live example of the drift this guard exists for.
  describe("tron", () => {
    it("classifies every mode tron supports", () => {
      const unclassified = Object.keys(MODE_TRAITS).filter(
        mode =>
          !TRON_NON_STAKING.has(mode) && deriveEarnTransactionType("tron", mode) === undefined,
      );
      expect(unclassified).toEqual([]);
    });

    // Its mode -> OperationType table is exported at runtime, so the broadcast-stage map can be
    // checked against the real thing instead of a copy of it.
    it("agrees with tron's own mode-to-operation-type table", () => {
      const disagreements = [...RESOURCE_STAKING_OPERATION_TYPES.entries()]
        .map(([mode, operationType]) => ({
          mode,
          operationType,
          fromMode: deriveEarnTransactionType("tron", mode),
          fromOperationType: deriveFromOperationType("tron", operationType),
        }))
        .filter(row => row.fromMode !== row.fromOperationType);
      expect(disagreements).toEqual([]);
    });
  });
});
