import { NetworkError } from "@ledgerhq/live-common/errors";
import { Config, getChainAPI } from ".";
import { Connection, SendTransactionError } from "@solana/web3.js";

jest.mock("@solana/web3.js", () => ({
  ...jest.requireActual("@solana/web3.js"),
  Connection: jest.fn(),
}));

const FAKE_CONFIG: Config = { endpoint: "http://fake-endpoint.com" };

describe("index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getChainAPI", () => {
    describe("sendRawTransaction", () => {
      it("should map SendTransactionError thrown by sendRawTransaction to a NetworkError", async () => {
        const sendTransactionError = new SendTransactionError({
          action: "simulate",
          signature:
            "5J8j6Xk2mNpQr3TvWxYzA7BcDeFgHiJkLmNoPqRsTuVwXyZ4a6b8cEd1fGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKl",
          transactionMessage:
            "Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1",
        });

        const logMessages = [
          "Program 11111111111111111111111111111111 success",
          "Program Stake11111111111111111111111111111111111111 invoke [1]",
          "Program log: Instruction: Initialize",
          "Program Stake11111111111111111111111111111111111111 consumed 7568 of 402850 compute units",
          "Program Stake11111111111111111111111111111111111111 success",
          "Program Stake11111111111111111111111111111111111111 invoke [1]",
          "Program log: Instruction: DelegateStake",
          "Program log: ERROR: Custom program error: 0xc",
          "Program Stake11111111111111111111111111111111111111 consumed 13179 of 395282 compute units",
          "Program Stake11111111111111111111111111111111111111 failed: custom program error: 0xc",
        ];

        const mockedConfirmTransaction = jest.fn();
        jest.mocked(Connection).mockImplementation(
          () =>
            ({
              sendRawTransaction: jest.fn().mockRejectedValueOnce(sendTransactionError),
              confirmTransaction: mockedConfirmTransaction,
              getTransaction: jest.fn().mockResolvedValue({
                meta: {
                  logMessages,
                },
              }),
            }) as unknown as Connection,
        );

        const chainAPI = getChainAPI(FAKE_CONFIG);
        const buffer = Buffer.from(
          "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi3hiCJJQMF8V8HpMSGRTnf2QrXZJhBXwL2H7WNpQo8rDmRkYP3TsNuHGWVZXePbkDsBbEqcfHxjFmTzKJnWqXvFdCqPHs6TaYpKwNm2BSjmGbDLMKfvL3p3d5Xh8fZqC9VtNEwRGfBuP7JkY4sQ3HmXe1yBzAV6cLKMDJ5rTsWNp8QvG2",
        );

        try {
          await chainAPI.sendRawTransaction(buffer);
          fail("sendRawTransaction did not throw an error as expected in the test");
        } catch (error) {
          expect(error).toBeInstanceOf(NetworkError);
          const networkError = error as InstanceType<typeof NetworkError>;
          expect(networkError).toMatchObject({
            message: sendTransactionError.message,
            logs: logMessages,
            cause: sendTransactionError,
          });
          expect(mockedConfirmTransaction).not.toHaveBeenCalled();
        }
      });
    });
  });
});
