import { deriveEarnTransactionType, type EarnTransactionType } from "./earnTransactionType";
import { COLLAPSES, deriveFromOperationType, UNRECOVERABLE_AT_BROADCAST } from "./operationType";

/**
 * The source of truth for what this package must classify: every in-app staking flow
 * (Ledger Live builds the transaction, the device signs it), keyed by family because family
 * is what determines the vocabulary.
 *
 * `mode` is the sign-stage word (a family `mode`, or Solana's `model.kind`); `operationType`
 * is what the family's own `buildOptimisticOperation` puts on the optimistic operation, which
 * is all the broadcast stage gets.
 *
 * `operationType: null` means **the broadcast stage cannot report this action**, which happens
 * two different ways: the family emits a generic type there (hedera `claim-rewards` is an
 * `OUT`), or the action collapses onto another action's type (cosmos `claimRewardCompound`
 * produces a `REWARD`, which derives `claimReward`). `UNRECOVERABLE_AT_BROADCAST` and
 * `COLLAPSES` say which, and the "known precision losses" block asserts every `null` row is
 * accounted for by one of them.
 *
 * Cosmos is one row for every cosmos-SDK currency: they share a single `Transaction` type and
 * mode union, so only the currency-id → family mapping differs.
 */
type Row = {
  mode: string;
  operationType: string | null;
  expected: EarnTransactionType;
};

const MATRIX: Record<string, Row[]> = {
  cardano: [
    { mode: "delegate", operationType: "DELEGATE", expected: "delegate" },
    { mode: "undelegate", operationType: "UNDELEGATE", expected: "undelegate" },
  ],
  celo: [
    { mode: "lock", operationType: "LOCK", expected: "deposit" },
    { mode: "vote", operationType: "VOTE", expected: "delegate" },
    { mode: "activate", operationType: "ACTIVATE", expected: "delegate" },
    { mode: "revoke", operationType: "REVOKE", expected: "undelegate" },
    { mode: "unlock", operationType: "UNLOCK", expected: "undelegate" },
    { mode: "withdraw", operationType: "WITHDRAW", expected: "withdraw" },
  ],
  cosmos: [
    { mode: "delegate", operationType: "DELEGATE", expected: "delegate" },
    { mode: "undelegate", operationType: "UNDELEGATE", expected: "undelegate" },
    { mode: "redelegate", operationType: "REDELEGATE", expected: "redelegate" },
    { mode: "claimReward", operationType: "REWARD", expected: "claimReward" },
    // Collapsed onto REWARD at broadcast — see COLLAPSES.
    { mode: "claimRewardCompound", operationType: null, expected: "compoundReward" },
  ],
  evm: [
    { mode: "delegate", operationType: "DELEGATE", expected: "delegate" },
    { mode: "redelegate", operationType: "REDELEGATE", expected: "redelegate" },
    { mode: "undelegate", operationType: "UNDELEGATE", expected: "undelegate" },
    { mode: "withdraw", operationType: "WITHDRAW_UNBONDED", expected: "withdraw" },
    { mode: "claimReward", operationType: "REWARD", expected: "claimReward" },
    { mode: "compoundReward", operationType: null, expected: "compoundReward" },
  ],
  hedera: [
    { mode: "delegate", operationType: "DELEGATE", expected: "delegate" },
    { mode: "undelegate", operationType: "UNDELEGATE", expected: "undelegate" },
    { mode: "redelegate", operationType: "REDELEGATE", expected: "redelegate" },
    { mode: "claim-rewards", operationType: null, expected: "claimReward" },
  ],
  multiversx: [
    { mode: "delegate", operationType: "DELEGATE", expected: "delegate" },
    { mode: "unDelegate", operationType: "UNDELEGATE", expected: "undelegate" },
    { mode: "withdraw", operationType: "WITHDRAW_UNBONDED", expected: "withdraw" },
    { mode: "claimRewards", operationType: "REWARD", expected: "claimReward" },
    { mode: "reDelegateRewards", operationType: null, expected: "compoundReward" },
  ],
  near: [
    { mode: "stake", operationType: "STAKE", expected: "delegate" },
    { mode: "unstake", operationType: "UNSTAKE", expected: "undelegate" },
    { mode: "withdraw", operationType: "WITHDRAW_UNSTAKED", expected: "withdraw" },
  ],
  polkadot: [
    { mode: "bond", operationType: "BOND", expected: "delegate" },
    { mode: "nominate", operationType: "NOMINATE", expected: "delegate" },
    { mode: "unbond", operationType: "UNBOND", expected: "undelegate" },
    { mode: "chill", operationType: "CHILL", expected: "undelegate" },
    { mode: "withdrawUnbonded", operationType: "WITHDRAW_UNBONDED", expected: "withdraw" },
    { mode: "claimReward", operationType: "REWARD_PAYOUT", expected: "claimReward" },
    // Collapsed onto BOND at broadcast, so it reads as a fresh delegation there.
    { mode: "rebond", operationType: null, expected: "redelegate" },
  ],
  solana: [
    { mode: "stake.createAccount", operationType: "DELEGATE", expected: "delegate" },
    { mode: "stake.delegate", operationType: "DELEGATE", expected: "delegate" },
    { mode: "stake.undelegate", operationType: "UNDELEGATE", expected: "undelegate" },
    // `IN` and `OUT` respectively — indistinguishable from ordinary transfers.
    { mode: "stake.withdraw", operationType: null, expected: "withdraw" },
    { mode: "stake.split", operationType: null, expected: "undelegate" },
  ],
  sui: [
    { mode: "delegate", operationType: "DELEGATE", expected: "delegate" },
    { mode: "undelegate", operationType: "UNDELEGATE", expected: "undelegate" },
  ],
  tezos: [
    { mode: "delegate", operationType: "DELEGATE", expected: "delegate" },
    { mode: "undelegate", operationType: "UNDELEGATE", expected: "undelegate" },
    { mode: "stake", operationType: "STAKE", expected: "delegate" },
    { mode: "unstake", operationType: "UNSTAKE", expected: "undelegate" },
    { mode: "finalize_unstake", operationType: "FINALIZE_UNSTAKE", expected: "withdraw" },
  ],
  tron: [
    { mode: "freeze", operationType: "FREEZE", expected: "delegate" },
    { mode: "vote", operationType: "VOTE", expected: "delegate" },
    { mode: "unfreeze", operationType: "UNFREEZE", expected: "undelegate" },
    { mode: "legacyUnfreeze", operationType: "LEGACY_UNFREEZE", expected: "undelegate" },
    { mode: "unDelegateResource", operationType: "UNDELEGATE_RESOURCE", expected: "undelegate" },
    { mode: "claimReward", operationType: "REWARD", expected: "claimReward" },
    {
      mode: "withdrawExpireUnfreeze",
      operationType: "WITHDRAW_EXPIRE_UNFREEZE",
      expected: "withdraw",
    },
  ],
  algorand: [{ mode: "claimReward", operationType: null, expected: "claimReward" }],
};

const rows = Object.entries(MATRIX).flatMap(([family, familyRows]) =>
  familyRows.map(row => ({ family, ...row })),
);

describe("staking action derivation", () => {
  describe("sign stage", () => {
    it.each(rows)("$family $mode -> $expected", ({ family, mode, expected }) => {
      expect(deriveEarnTransactionType(family, mode)).toBe(expected);
    });

    it.each(["send", "token.send", "changeTrust", "optIn", "register"])(
      "derives nothing for the non-staking mode %s",
      mode => {
        for (const family of Object.keys(MATRIX)) {
          expect(deriveEarnTransactionType(family, mode)).toBeUndefined();
        }
      },
    );
  });

  describe("broadcast stage", () => {
    const recoverable = rows.filter(row => row.operationType !== null);

    it.each(recoverable)(
      "$family $operationType -> $expected",
      ({ family, operationType, expected }) => {
        expect(deriveFromOperationType(family, operationType!)).toBe(expected);
      },
    );

    // These are what a plain send, an incoming transfer or a fee-only operation produce. If
    // any of them ever mapped to an action, every ordinary transfer would enter the funnel.
    it.each(["OUT", "IN", "NONE", "FEES", "UNKNOWN", "NFT_OUT"])(
      "never claims the generic operation type %s",
      operationType => {
        for (const family of Object.keys(MATRIX)) {
          expect(deriveFromOperationType(family, operationType)).toBeUndefined();
        }
      },
    );
  });

  /**
   * The regression net. Success is only knowable at broadcast, so a family whose two stages
   * disagree silently drops its completed events — which is exactly what happened to Solana
   * before `deriveFromOperationType` existed.
   */
  describe("the two stages agree", () => {
    const recoverable = rows.filter(row => row.operationType !== null);

    it.each(recoverable)(
      "$family: $mode and $operationType derive the same action",
      ({ family, mode, operationType }) => {
        expect(deriveFromOperationType(family, operationType!)).toBe(
          deriveEarnTransactionType(family, mode),
        );
      },
    );

    it("has a broadcast-stage mapping for every recoverable staking mode", () => {
      const missing = recoverable.filter(
        row => deriveFromOperationType(row.family, row.operationType!) === undefined,
      );
      expect(missing).toEqual([]);
    });
  });

  /**
   * Documented losses. Asserted rather than described so that a coin module fixing one of
   * them (or a map widening that quietly papers over it) fails here and forces a decision.
   */
  describe("known precision losses", () => {
    it.each(rows.filter(row => row.operationType === null))(
      "$family $mode is not recoverable at the broadcast stage",
      ({ family, mode, expected }) => {
        expect(deriveEarnTransactionType(family, mode)).toBe(expected);
        const collapsedOnto = COLLAPSES[family]?.find(pair => pair[1] === mode)?.[0];
        const isUnrecoverable = UNRECOVERABLE_AT_BROADCAST[family]?.includes(mode);
        expect(Boolean(collapsedOnto) || Boolean(isUnrecoverable)).toBe(true);
      },
    );

    it("collapses list only names modes the matrix knows", () => {
      for (const [family, pairs] of Object.entries(COLLAPSES)) {
        const known = MATRIX[family].map(row => row.mode);
        for (const [kept, lost] of pairs) {
          expect(known).toContain(kept);
          expect(known).toContain(lost);
        }
      }
    });
  });
});

/**
 * A family that migrates onto the generic coin framework and adopts its vocabulary must be
 * classified without anyone editing this package. "newchain" stands in for that family: it
 * appears in neither map, so every assertion here goes through the generic fallback.
 */
describe("a family the maps have never seen", () => {
  it.each([
    ["delegate", "delegate"],
    ["redelegate", "redelegate"],
    ["undelegate", "undelegate"],
    ["stake", "delegate"],
    ["unstake", "undelegate"],
    ["finalize_unstake", "withdraw"],
    ["withdraw", "withdraw"],
    ["claimReward", "claimReward"],
    ["compoundReward", "compoundReward"],
  ])("derives the generic mode %s as %s", (mode, expected) => {
    expect(deriveEarnTransactionType("newchain", mode)).toBe(expected);
  });

  it.each([
    ["DELEGATE", "delegate"],
    ["REDELEGATE", "redelegate"],
    ["UNDELEGATE", "undelegate"],
    ["STAKE", "delegate"],
    ["UNSTAKE", "undelegate"],
    ["FINALIZE_UNSTAKE", "withdraw"],
    ["WITHDRAW_UNBONDED", "withdraw"],
    ["REWARD", "claimReward"],
  ])("derives the generic operation type %s as %s", (operationType, expected) => {
    expect(deriveFromOperationType("newchain", operationType)).toBe(expected);
  });

  it.each(["send", "changeTrust", "send-legacy", "send-eip1559"])(
    "still derives nothing for the non-staking generic mode %s",
    mode => {
      expect(deriveEarnTransactionType("newchain", mode)).toBeUndefined();
    },
  );

  it.each(["OUT", "IN", "NONE", "FEES", "OPT_IN"])(
    "still derives nothing for the generic operation type %s",
    operationType => {
      expect(deriveFromOperationType("newchain", operationType)).toBeUndefined();
    },
  );

  // A family's own word outranks the generic one, so migration can never silently change
  // what an existing family reports.
  it("lets a family override a word the generic map also defines", () => {
    expect(deriveEarnTransactionType("celo", "withdraw")).toBe("withdraw");
    expect(deriveEarnTransactionType("tezos", "stake")).toBe("delegate");
    expect(deriveEarnTransactionType("tron", "vote")).toBe("delegate");
  });
});
