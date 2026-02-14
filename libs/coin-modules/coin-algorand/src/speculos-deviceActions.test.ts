import { SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { BigNumber } from "bignumber.js";
import { acceptTransaction } from "./speculos-deviceActions";
import type { AlgorandAccount, AlgorandTransaction } from "./types";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/bot/specs", () => ({
  deviceActionFlow: jest.fn(config => config),
  formatDeviceAmount: jest.fn((currency, amount) => `${amount.toString()} ${currency.ticker}`),
  SpeculosButton: {
    RIGHT: "RIGHT",
    LEFT: "LEFT",
    BOTH: "BOTH",
  },
}));

jest.mock("./deviceTransactionConfig", () => ({
  displayTokenValue: jest.fn(token => `${token.ticker} (${token.id})`),
}));

describe("speculos-deviceActions", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenById: async (id: string) => {
        if (id === "algorand/asa/12345") {
          return {
            id,
            ticker: "USDC",
            units: [{ magnitude: 6 }],
          };
        }
        if (id === "algorand/asa/67890") {
          return {
            id,
            ticker: "TEST",
            units: [{ magnitude: 0 }],
          };
        }
        return undefined;
      },
    } as never);
  });

  describe("acceptTransaction", () => {
    it("should be defined", () => {
      expect(acceptTransaction).not.toBeUndefined();
    });

    it("should have steps array", () => {
      expect(acceptTransaction.steps).not.toBeUndefined();
      expect(Array.isArray(acceptTransaction.steps)).toBe(true);
    });

    describe("steps", () => {
      const findStep = (title: string) => acceptTransaction.steps.find(s => s.title === title);

      describe("Txn Type step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Txn Type");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });

        it("should return 'Asset xfer' for subAccount transaction", () => {
          const step = findStep("Txn Type");
          const transaction = { subAccountId: "sub-1" } as AlgorandTransaction;

          const result = step?.expectedValue?.({ transaction } as never);

          expect(result).toBe("Asset xfer");
        });

        it("should return 'Payment' for main account transaction", () => {
          const step = findStep("Txn Type");
          const transaction = { subAccountId: null } as AlgorandTransaction;

          const result = step?.expectedValue?.({ transaction } as never);

          expect(result).toBe("Payment");
        });
      });

      describe("Asset xfer step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Asset xfer");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });
      });

      describe("Payment step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Payment");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });
      });

      describe("Fee step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Fee");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });

        it("should format fees with currency", () => {
          const step = findStep("Fee");
          const account = { currency: { ticker: "ALGO" } } as AlgorandAccount;
          const status = { estimatedFees: new BigNumber("1000") };

          const result = step?.expectedValue?.({ account, status } as never);

          expect(result).toBe("1000 ALGO");
        });
      });

      describe("Asset ID step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Asset ID");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });

        it("should return token display value when token found via assetId", async () => {
          const step = findStep("Asset ID");
          const transaction = { assetId: "algorand/asa/12345" } as AlgorandTransaction;

          const result = await step?.expectedValue?.({ transaction } as never);

          expect(result).toContain("USDC");
        });

        it("should return token display value when token found via subAccountId", async () => {
          const step = findStep("Asset ID");
          // subAccountId uses format like "algorand/asa/12345" for extractTokenId
          const transaction = {
            assetId: undefined,
            subAccountId: "algorand/asa/12345",
          } as unknown as AlgorandTransaction;

          const result = await step?.expectedValue?.({ transaction } as never);

          expect(result).toContain("USDC");
        });

        it("should return #id format when token not found", async () => {
          const step = findStep("Asset ID");
          const transaction = { assetId: "algorand/asa/99999" } as AlgorandTransaction;

          const result = await step?.expectedValue?.({ transaction } as never);

          expect(result).toBe("#99999");
        });

        it("should handle empty assetId and subAccountId", async () => {
          const step = findStep("Asset ID");
          const transaction = {
            assetId: undefined,
            subAccountId: undefined,
          } as AlgorandTransaction;

          const result = await step?.expectedValue?.({ transaction } as never);

          expect(result).toBe("#");
        });
      });

      describe("Asset amt step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Asset amt");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });

        it("should return '0' for optIn mode", () => {
          const step = findStep("Asset amt");
          const transaction = { mode: "optIn" } as AlgorandTransaction;
          const status = { amount: new BigNumber("100") };

          const result = step?.expectedValue?.({ transaction, status } as never);

          expect(result).toBe("0");
        });

        it("should return amount for send mode", () => {
          const step = findStep("Asset amt");
          const transaction = { mode: "send" } as AlgorandTransaction;
          const status = { amount: new BigNumber("500") };

          const result = step?.expectedValue?.({ transaction, status } as never);

          expect(result).toBe("500");
        });
      });

      describe("Sender step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Sender");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });
      });

      describe("Receiver step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Receiver");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });

        it("should return transaction recipient", () => {
          const step = findStep("Receiver");
          const transaction = { recipient: "RECIPIENT_ADDRESS" } as AlgorandTransaction;

          const result = step?.expectedValue?.({ transaction } as never);

          expect(result).toBe("RECIPIENT_ADDRESS");
        });
      });

      describe("Asset dst step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Asset dst");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });

        it("should return transaction recipient", () => {
          const step = findStep("Asset dst");
          const transaction = { recipient: "ASSET_RECIPIENT" } as AlgorandTransaction;

          const result = step?.expectedValue?.({ transaction } as never);

          expect(result).toBe("ASSET_RECIPIENT");
        });
      });

      describe("Amount step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Amount");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });

        it("should return '0' for claimReward mode", async () => {
          const step = findStep("Amount");
          const transaction = { mode: "claimReward" } as AlgorandTransaction;
          const status = { amount: new BigNumber("100") };
          const account = { currency: { ticker: "ALGO" } } as AlgorandAccount;

          const result = await step?.expectedValue?.({ account, status, transaction } as never);

          expect(result).toBe("0");
        });

        it("should format amount with token for optIn when token found", async () => {
          const step = findStep("Amount");
          const transaction = {
            mode: "optIn",
            assetId: "algorand/asa/12345",
          } as AlgorandTransaction;
          const status = { amount: new BigNumber("0") };
          const account = { currency: { ticker: "ALGO" } } as AlgorandAccount;

          const result = await step?.expectedValue?.({ account, status, transaction } as never);

          expect(result).toContain("USDC");
        });

        it("should return '0' for optIn when token not found", async () => {
          const step = findStep("Amount");
          const transaction = {
            mode: "optIn",
            assetId: "algorand/asa/99999",
          } as AlgorandTransaction;
          const status = { amount: new BigNumber("0") };
          const account = { currency: { ticker: "ALGO" } } as AlgorandAccount;

          const result = await step?.expectedValue?.({ account, status, transaction } as never);

          expect(result).toBe("0");
        });

        it("should format amount with currency for send mode", async () => {
          const step = findStep("Amount");
          const transaction = { mode: "send" } as AlgorandTransaction;
          const status = { amount: new BigNumber("1000000") };
          const account = { currency: { ticker: "ALGO" } } as AlgorandAccount;

          const result = await step?.expectedValue?.({ account, status, transaction } as never);

          expect(result).toBe("1000000 ALGO");
        });
      });

      describe("APPROVE step", () => {
        it("should exist with BOTH button", () => {
          const step = findStep("APPROVE");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.BOTH);
        });
      });

      describe("Sign step", () => {
        it("should exist with BOTH button", () => {
          const step = findStep("Sign");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.BOTH);
        });
      });

      describe("Review step", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Review");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });
      });

      describe("Genesis ID step (testnet)", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Genesis ID");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });
      });

      describe("Genesis hash step (testnet)", () => {
        it("should exist with RIGHT button", () => {
          const step = findStep("Genesis hash");
          expect(step).not.toBeUndefined();
          expect(step?.button).toBe(SpeculosButton.RIGHT);
        });
      });
    });

    describe("step count", () => {
      it("should have all expected steps", () => {
        const expectedTitles = [
          "Txn Type",
          "Asset xfer",
          "Payment",
          "Fee",
          "Asset ID",
          "Asset amt",
          "Sender",
          "Receiver",
          "Asset dst",
          "Amount",
          "APPROVE",
          "Sign",
          "Review",
          "Genesis ID",
          "Genesis hash",
        ];

        expect(acceptTransaction.steps.length).toBe(expectedTitles.length);

        for (const title of expectedTitles) {
          const step = acceptTransaction.steps.find(s => s.title === title);
          expect(step).not.toBeUndefined();
        }
      });
    });
  });
});
