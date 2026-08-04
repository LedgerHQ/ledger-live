import { deriveEarnTransactionType, type EarnTransactionType } from "./earnTransactionType";

describe("deriveEarnTransactionType", () => {
  // Solana is the priority native family, and the one a family-agnostic verb list
  // missed entirely because its actions are dotted.
  describe("solana (model.kind)", () => {
    it.each<[string, EarnTransactionType]>([
      ["stake.createAccount", "delegate"],
      ["stake.delegate", "delegate"],
      ["stake.undelegate", "undelegate"],
      ["stake.withdraw", "withdraw"],
      ["stake.split", "undelegate"],
    ])("%s -> %s", (raw, expected) => {
      expect(deriveEarnTransactionType("solana", raw)).toBe(expected);
    });

    it.each(["transfer", "token.transfer", "raw"])("%s is not a staking action", raw => {
      expect(deriveEarnTransactionType("solana", raw)).toBeUndefined();
    });
  });

  describe("families in the stakePrograms scope", () => {
    it.each<[string, string, EarnTransactionType]>([
      // cosmos-SDK: one family serves osmo, dydx, injective, axelar, mantra, …
      ["cosmos", "delegate", "delegate"],
      ["cosmos", "undelegate", "undelegate"],
      ["cosmos", "redelegate", "redelegate"],
      ["cosmos", "claimReward", "claimReward"],
      ["cosmos", "claimRewardCompound", "compoundReward"],
      ["cardano", "delegate", "delegate"],
      ["cardano", "undelegate", "undelegate"],
      ["tezos", "stake", "delegate"],
      ["tezos", "unstake", "undelegate"],
      ["tezos", "finalize_unstake", "withdraw"],
      ["near", "stake", "delegate"],
      ["near", "withdraw", "withdraw"],
      // camelCase in the source union
      ["multiversx", "unDelegate", "undelegate"],
      ["multiversx", "reDelegateRewards", "compoundReward"],
      ["multiversx", "claimRewards", "claimReward"],
      // celo/tron split staking across two transactions
      ["celo", "lock", "deposit"],
      ["celo", "vote", "delegate"],
      ["celo", "revoke", "undelegate"],
      ["tron", "freeze", "delegate"],
      ["tron", "withdrawExpireUnfreeze", "withdraw"],
      // kebab-case in the source enum
      ["hedera", "claim-rewards", "claimReward"],
      ["sui", "delegate", "delegate"],
      ["polkadot", "bond", "delegate"],
      ["polkadot", "withdrawUnbonded", "withdraw"],
    ])("%s / %s -> %s", (family, raw, expected) => {
      expect(deriveEarnTransactionType(family, raw)).toBe(expected);
    });
  });

  describe("EVM (selector name)", () => {
    it.each<[string, EarnTransactionType]>([
      ["approve", "approve"],
      ["deposit", "deposit"],
      ["submit", "deposit"], // Lido
      ["mint", "deposit"], // ERC-4626
      ["redeem", "redeem"], // ERC-4626
      ["withdraw", "withdraw"],
      ["requestWithdrawals", "withdraw"], // Lido
      ["claimRewards", "claimReward"],
      // Exit counterpart of deposit: pooled/vault staking has no validator, so this
      // is withdraw rather than undelegate.
      ["unstake", "withdraw"],
      // Genuine on-chain delegation (EVM-native staking chains) is still delegation.
      ["undelegate", "undelegate"],
    ])("%s -> %s", (raw, expected) => {
      expect(deriveEarnTransactionType("evm", raw)).toBe(expected);
    });

    it("accepts the wallet-api family alias 'ethereum'", () => {
      expect(deriveEarnTransactionType("ethereum", "deposit")).toBe("deposit");
    });

    it.each(["swap", "transfer", "unknown", "multiSwap"])("%s is not a staking action", raw => {
      expect(deriveEarnTransactionType("evm", raw)).toBeUndefined();
    });
  });

  describe("aliases and edge cases", () => {
    it("maps the elrond currency id onto the multiversx family", () => {
      expect(deriveEarnTransactionType("elrond", "delegate")).toBe("delegate");
    });

    it("is case-insensitive on the raw action", () => {
      expect(deriveEarnTransactionType("cosmos", "DELEGATE")).toBe("delegate");
    });

    it("does not treat an algorand asset opt-in as staking", () => {
      expect(deriveEarnTransactionType("algorand", "optIn")).toBeUndefined();
      expect(deriveEarnTransactionType("algorand", "claimReward")).toBe("claimReward");
    });

    it("does not guess for TON's ambiguous jetton-burn", () => {
      expect(deriveEarnTransactionType("ton", "tonstakers-deposit")).toBe("deposit");
      expect(deriveEarnTransactionType("ton", "jetton-burn")).toBeUndefined();
    });

    it.each([
      [undefined, "delegate"],
      ["cosmos", undefined],
      ["not-a-family", "delegate"],
      ["bitcoin", "send"],
    ])("returns undefined for (%s, %s)", (family, raw) => {
      expect(deriveEarnTransactionType(family, raw)).toBeUndefined();
    });
  });
});
