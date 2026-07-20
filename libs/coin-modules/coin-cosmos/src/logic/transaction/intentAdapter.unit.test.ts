import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { intentToAccount, intentToTransaction } from "./intentAdapter";

const baseSend = {
  intentType: "transaction",
  type: "send",
  sender: "cosmos1sender",
  recipient: "cosmos1recipient",
  amount: 1_000_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

const stakingIntent = (o: Record<string, unknown>) =>
  ({
    intentType: "staking",
    sender: "cosmos1sender",
    recipient: "",
    amount: 1_000_000n,
    asset: { type: "native" },
    ...o,
  }) as unknown as TransactionIntent;

describe("logic/transaction/intentAdapter", () => {
  describe("intentToAccount", () => {
    it("carries the sender address and resolved currency", () => {
      const account = intentToAccount(baseSend, "cosmos");
      expect(account.freshAddress).toBe("cosmos1sender");
      expect(account.currency.id).toBe("cosmos");
    });
  });

  describe("intentToTransaction (native)", () => {
    it("maps a native send", () => {
      const tx = intentToTransaction(baseSend);
      expect(tx.family).toBe("cosmos");
      expect(tx.mode).toBe("send");
      expect(tx.recipient).toBe("cosmos1recipient");
      expect(tx.amount.toFixed()).toBe("1000000");
      expect(tx.memo).toBe("");
      expect(tx.useAllAmount).toBe(false);
    });

    it("extracts a string memo", () => {
      const withMemo = {
        ...baseSend,
        memo: { type: "string", value: "hi" },
      } as unknown as TransactionIntent;
      expect(intentToTransaction(withMemo).memo).toBe("hi");
    });

    it("ignores a non-string memo", () => {
      const withMemo = { ...baseSend, memo: { type: "none" } } as unknown as TransactionIntent;
      expect(intentToTransaction(withMemo).memo).toBe("");
    });

    it("propagates useAllAmount", () => {
      const sendAll = { ...baseSend, useAllAmount: true } as unknown as TransactionIntent;
      expect(intentToTransaction(sendAll).useAllAmount).toBe(true);
    });
  });

  describe("intentToTransaction (staking)", () => {
    it.each([
      ["delegate", "delegate"],
      ["undelegate", "undelegate"],
      ["claimReward", "claimReward"],
      ["compoundReward", "claimRewardCompound"],
    ])("maps staking mode %s to internal mode %s", (mode, expected) => {
      const tx = intentToTransaction(stakingIntent({ mode, valAddress: "cosmosvaloper1v" }));
      expect(tx.mode).toBe(expected);
      expect(tx.sourceValidator).toBeUndefined();
      expect(tx.validators).toHaveLength(1);
      expect(tx.validators[0].address).toBe("cosmosvaloper1v");
      expect(tx.validators[0].amount.toFixed()).toBe("1000000");
    });

    it("maps redelegate to source + destination validators", () => {
      const tx = intentToTransaction(
        stakingIntent({
          mode: "redelegate",
          valAddress: "cosmosvaloper1src",
          dstValAddress: "cosmosvaloper1dst",
        }),
      );
      expect(tx.mode).toBe("redelegate");
      expect(tx.sourceValidator).toBe("cosmosvaloper1src");
      expect(tx.validators[0].address).toBe("cosmosvaloper1dst");
    });

    it("throws on an unsupported staking mode (withdraw)", () => {
      expect(() =>
        intentToTransaction(stakingIntent({ mode: "withdraw", valAddress: "cosmosvaloper1v" })),
      ).toThrow("unsupported staking mode");
    });
  });
});
