/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { FeatureId } from "@shared/feature-flags";
import { solanaTransaction, TransactionWithCustomFee } from "./transactionStrategies";
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
        model: { kind: "transfer", uiState: {} },
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
        model: { kind: "transfer", uiState: {} },
      });
    });
  });
});
