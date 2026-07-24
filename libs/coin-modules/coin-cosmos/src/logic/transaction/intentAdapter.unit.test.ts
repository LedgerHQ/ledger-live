import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { intentToMessageParams } from "./intentAdapter";

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
  describe("intentToMessageParams (native send)", () => {
    it("carries sender, resolved denom, and the send fields", () => {
      const params = intentToMessageParams(baseSend, "cosmos");
      expect(params.senderAddress).toBe("cosmos1sender");
      expect(params.currencyId).toBe("cosmos");
      expect(params.denom).toBe("uatom");
      expect(params.mode).toBe("send");
      expect(params.recipient).toBe("cosmos1recipient");
      expect(params.amount.toFixed()).toBe("1000000");
      expect(params.memo).toBe("");
      expect(params.validators).toHaveLength(0);
      expect(params.sourceValidator).toBeUndefined();
    });

    it("extracts a string memo", () => {
      const withMemo = {
        ...baseSend,
        memo: { type: "string", value: "hi" },
      } as unknown as TransactionIntent;
      expect(intentToMessageParams(withMemo, "cosmos").memo).toBe("hi");
    });

    it("ignores a non-string memo", () => {
      const withMemo = { ...baseSend, memo: { type: "none" } } as unknown as TransactionIntent;
      expect(intentToMessageParams(withMemo, "cosmos").memo).toBe("");
    });
  });

  describe("intentToMessageParams (staking)", () => {
    it.each([
      ["delegate", "delegate"],
      ["undelegate", "undelegate"],
      ["claimReward", "claimReward"],
      ["compoundReward", "claimRewardCompound"],
    ])("maps staking mode %s to internal mode %s", (mode, expected) => {
      const params = intentToMessageParams(
        stakingIntent({ mode, valAddress: "cosmosvaloper1v" }),
        "cosmos",
      );
      expect(params.mode).toBe(expected);
      expect(params.sourceValidator).toBeUndefined();
      expect(params.validators).toHaveLength(1);
      expect(params.validators[0].address).toBe("cosmosvaloper1v");
      expect(params.validators[0].amount.toFixed()).toBe("1000000");
    });

    it("maps redelegate to source + destination validators", () => {
      const params = intentToMessageParams(
        stakingIntent({
          mode: "redelegate",
          valAddress: "cosmosvaloper1src",
          dstValAddress: "cosmosvaloper1dst",
        }),
        "cosmos",
      );
      expect(params.mode).toBe("redelegate");
      expect(params.sourceValidator).toBe("cosmosvaloper1src");
      expect(params.validators[0].address).toBe("cosmosvaloper1dst");
    });

    it("throws on an unsupported staking mode (withdraw)", () => {
      expect(() =>
        intentToMessageParams(
          stakingIntent({ mode: "withdraw", valAddress: "cosmosvaloper1v" }),
          "cosmos",
        ),
      ).toThrow("unsupported staking mode");
    });
  });
});
