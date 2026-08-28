import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
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

/**
 * Currency id -> the family it resolves to -> a staking mode that family accepts.
 *
 * The classifier keys on **family**, which is what lets one cosmos row cover osmo, dydx and the
 * rest. That only holds while these ids keep resolving to the family the classifier has a map
 * for, and the classifier itself cannot check it: the currency registry lives in
 * `@domain/entity-currency-crypto`, which `@ledgerhq/transaction-observability` does not depend
 * on. So it is checked here, against the real registry, end to end — id, family, action.
 *
 * A currency re-homed to another family (as tron was, onto the generic coin framework) fails
 * this rather than silently dropping out of the funnel.
 */
const STAKING_CURRENCIES: Array<[string, string, string]> = [
  ["cardano", "cardano", "delegate"],
  ["celo", "celo", "vote"],
  ["cosmos", "cosmos", "delegate"],
  ["osmo", "cosmos", "delegate"],
  ["dydx", "cosmos", "delegate"],
  ["injective", "cosmos", "delegate"],
  ["mantra", "cosmos", "delegate"],
  ["zenrock", "cosmos", "delegate"],
  ["xion", "cosmos", "delegate"],
  ["axelar", "cosmos", "delegate"],
  ["quicksilver", "cosmos", "delegate"],
  ["persistence", "cosmos", "delegate"],
  ["sei_evm", "evm", "delegate"],
  ["monad", "evm", "delegate"],
  ["somnia", "evm", "delegate"],
  ["zero_gravity", "evm", "delegate"],
  ["hedera", "hedera", "delegate"],
  ["elrond", "multiversx", "delegate"],
  ["near", "near", "stake"],
  ["polkadot", "polkadot", "bond"],
  ["solana", "solana", "stake.createAccount"],
  ["sui", "sui", "delegate"],
  ["tezos", "tezos", "delegate"],
  ["tron", "tron", "freeze"],
];

describe("staking currencies still resolve to a family the classifier knows", () => {
  it.each(STAKING_CURRENCIES)("%s is a %s currency", (currencyId, family) => {
    expect(getCryptoCurrencyById(currencyId).family).toBe(family);
  });

  it.each(STAKING_CURRENCIES)(
    "%s reaches a staking action through its real family",
    (currencyId, _family, mode) => {
      const family = getCryptoCurrencyById(currencyId).family;
      expect(deriveEarnTransactionType(family, mode)).toBeDefined();
    },
  );
});
