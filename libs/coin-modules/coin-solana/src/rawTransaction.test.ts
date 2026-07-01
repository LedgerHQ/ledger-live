import BigNumber from "bignumber.js";
import { ChainAPI } from "./network";
import { toLiveTransaction } from "./rawTransaction";

describe("toLiveTransaction", () => {
  it("should convert a raw transaction to a Ledger Wallet transaction", async () => {
    const api = { getFeeForMessage: jest.fn().mockResolvedValueOnce(null) } as unknown as ChainAPI;
    const serializedTransaction =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=";
    const templateId = "084c694669";

    const transaction = await toLiveTransaction(api, serializedTransaction, templateId);
    expect(transaction).toEqual({
      templateId,
      raw: serializedTransaction,
      family: "solana",
      amount: BigNumber(0),
      recipient: "",
      model: {
        kind: "raw",
        uiState: {},
        commandDescriptor: {
          command: {
            kind: "raw",
            raw: serializedTransaction,
          },
          fee: 0,
          warnings: {},
          errors: {},
        },
      },
    });
  });

  it("should not include a template id field when not provided", async () => {
    const api = { getFeeForMessage: jest.fn().mockResolvedValueOnce(null) } as unknown as ChainAPI;
    const serializedTransaction =
      "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDNzWs4isgmR+LEHY8ZcgBBLMnC4ckD1iuhSa2/Y+69I91oyGFaAZ/9w4srgx9KoqiHtPM6Vur7h4D6XVoSgrEhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALt5JNk+MAN8BXYrlkxMEL1C/sM3+ZFYwZw4eofBOKp4BAgIAAQwCAAAAgJaYAAAAAAA=";

    const transaction = await toLiveTransaction(api, serializedTransaction);
    expect(transaction).toEqual({
      raw: serializedTransaction,
      family: "solana",
      amount: BigNumber(0),
      recipient: "",
      model: {
        kind: "raw",
        uiState: {},
        commandDescriptor: {
          command: {
            kind: "raw",
            raw: serializedTransaction,
          },
          fee: 0,
          warnings: {},
          errors: {},
        },
      },
    });
  });
});
