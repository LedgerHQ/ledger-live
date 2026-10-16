/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { FeatureId } from "@shared/feature-flags";
import {
  bitcoinTransaction,
  hederaTransaction,
  solanaTransaction,
  TransactionWithCustomFee,
} from "./transactionStrategies";
import BigNumber from "bignumber.js";
import type { GetFeatureFn } from "../../wallet-api/FeatureFlags/resolver";

function makeGetFeature(enabled: boolean = true): GetFeatureFn {
  return (featureId: FeatureId) => {
    if (featureId === "lifiSolana") {
      return {
        enabled,
      };
    }

    return null;
  };
}

describe("transactionStrategies", () => {
  describe("solanaTransaction", () => {
    it("should return a Solana transaction with extra parameters when LIFI feature flag is enabled", () => {
      const extraTransactionParameters = {
        data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=",
        templateId: "084c694669",
      };
      const transaction = {
        amount: BigNumber(1),
        recipient: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
        extraTransactionParameters: extraTransactionParameters as unknown as string, // Needed, wrong type in the function for the moment, will be fixed later
      } as unknown as TransactionWithCustomFee;

      expect(solanaTransaction(transaction, makeGetFeature())).toEqual({
        family: "solana",
        amount: transaction.amount,
        recipient: transaction.recipient,
        mode: "send",
        raw: extraTransactionParameters.data,
        templateId: extraTransactionParameters.templateId,
      });
    });

    it("should return a Solana transaction without extra parameters when LIFI feature flag is disabled", () => {
      const extraTransactionParameters = {
        data: "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=",
        templateId: "084c694669",
      };
      const transaction = {
        amount: BigNumber(1),
        recipient: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
        extraTransactionParameters: extraTransactionParameters as unknown as string, // Needed, wrong type in the function for the moment, will be fixed later
      } as unknown as TransactionWithCustomFee;

      expect(solanaTransaction(transaction, makeGetFeature(false))).toEqual({
        family: "solana",
        amount: transaction.amount,
        recipient: transaction.recipient,
        mode: "send",
      });
    });
  });

  describe("hederaTransaction", () => {
    it("should carry the payin memo in the generic memo fields", () => {
      const transaction: TransactionWithCustomFee = {
        family: "hedera",
        amount: BigNumber(1),
        recipient: "0.0.1234",
        customFeeConfig: {},
        payinExtraId: "payin-42",
      };

      expect(hederaTransaction(transaction)).toEqual({
        family: "hedera",
        mode: "send",
        amount: transaction.amount,
        recipient: transaction.recipient,
        memoType: "string",
        memoValue: "payin-42",
      });
    });
  });

  describe("bitcoinTransaction", () => {
    const base = {
      family: "bitcoin",
      amount: new BigNumber(1000),
      recipient: "bc1qpayin",
    };

    it("returns a plain send when neither a fee rate nor a payin memo is given", () => {
      const transaction = { ...base, customFeeConfig: {} } as TransactionWithCustomFee;

      expect(bitcoinTransaction(transaction)).toEqual({
        family: "bitcoin",
        amount: base.amount,
        recipient: base.recipient,
      });
    });

    it("returns a plain send without custom fee config", () => {
      const transaction = {
        ...base,
        customFeeConfig: undefined,
      } as unknown as TransactionWithCustomFee;

      expect(bitcoinTransaction(transaction)).not.toHaveProperty("familySpecificData");
    });

    it("puts the custom fee rate in familySpecificData as a decimal string", () => {
      const transaction = {
        ...base,
        customFeeConfig: { feePerByte: new BigNumber("12.5") },
      } as TransactionWithCustomFee;

      const result = bitcoinTransaction(transaction);

      expect(result).toEqual({
        family: "bitcoin",
        amount: base.amount,
        recipient: base.recipient,
        familySpecificData: { feePerByte: "12.5" },
      });
      expect(result).not.toHaveProperty("feePerByte");
    });

    it("ignores a fee rate that is not a BigNumber", () => {
      const transaction = {
        ...base,
        customFeeConfig: { feePerByte: "12" },
      } as unknown as TransactionWithCustomFee;

      expect(bitcoinTransaction(transaction)).not.toHaveProperty("familySpecificData");
    });

    it("hex encodes the payin memo as OP_RETURN data", () => {
      const transaction = {
        ...base,
        customFeeConfig: {},
        extraTransactionParameters: "memo",
      } as TransactionWithCustomFee;

      const result = bitcoinTransaction(transaction);

      expect(result.familySpecificData).toEqual({
        opReturnData: Buffer.from("memo", "utf-8").toString("hex"),
      });
      expect(result).not.toHaveProperty("opReturnData");
    });

    it("carries both the fee rate and the payin memo", () => {
      const transaction = {
        ...base,
        customFeeConfig: { feePerByte: new BigNumber(3) },
        extraTransactionParameters: "=:ETH.ETH:0xabc",
      } as TransactionWithCustomFee;

      expect(bitcoinTransaction(transaction).familySpecificData).toEqual({
        feePerByte: "3",
        opReturnData: Buffer.from("=:ETH.ETH:0xabc", "utf-8").toString("hex"),
      });
    });
  });
});
