import { NetworkError } from "../../errors";
import { Config, getChainAPI } from ".";
import { Connection, PublicKey, SendTransactionError, StakeProgram } from "@solana/web3.js";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

jest.mock("@solana/web3.js", () => ({
  ...jest.requireActual("@solana/web3.js"),
  Connection: jest.fn(),
}));

const FAKE_CONFIG: Config = { endpoint: "http://fake-endpoint.com" };
const FIRST_STAKE_ACCOUNT = "FirstStakeAccountPubkey11111111111111111111";
const SECOND_STAKE_ACCOUNT = "SecondStakeAccountPubkey1111111111111111111";
const stakeAccount = (pubkey: string) => ({
  pubkey,
  account: {
    lamports: 1000,
    owner: StakeProgram.programId.toBase58(),
    executable: false,
    rentEpoch: 0,
    space: 200,
    data: { program: "stake", parsed: { type: "uninitialized" }, space: 200 },
  },
});
const rpcJson = (payload: Record<string, unknown>) =>
  HttpResponse.json({ jsonrpc: "2.0", id: 1, ...payload });

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
          });
          expect(mockedConfirmTransaction).not.toHaveBeenCalled();
        }
      });
    });

    describe("getStakeAccountsByWithdrawAuth", () => {
      const mockServer = setupServer();
      const authAddr = "AuthorityAddress111111111111111111111111111";
      const filters = [{ memcmp: { offset: 44, bytes: authAddr } }];

      beforeAll(() => mockServer.listen({ onUnhandledRequest: "error" }));
      afterEach(() => mockServer.resetHandlers());
      afterAll(() => mockServer.close());

      it("follows getProgramAccountsV2 pagination", async () => {
        const cursors: unknown[] = [];
        mockServer.use(
          http.post(FAKE_CONFIG.endpoint, async ({ request }) => {
            const { params } = (await request.json()) as {
              params: [string, { paginationKey?: string }];
            };
            cursors.push(params[1].paginationKey);
            return params[1].paginationKey
              ? rpcJson({
                  result: { accounts: [stakeAccount(SECOND_STAKE_ACCOUNT)] },
                })
              : rpcJson({
                  result: {
                    accounts: [stakeAccount(FIRST_STAKE_ACCOUNT)],
                    paginationKey: "page-2-cursor",
                  },
                });
          }),
        );

        const result = await getChainAPI(FAKE_CONFIG).getStakeAccountsByWithdrawAuth(authAddr);

        expect(result.map(({ pubkey }) => pubkey.toBase58())).toEqual([
          FIRST_STAKE_ACCOUNT,
          SECOND_STAKE_ACCOUNT,
        ]);
        // Only the cursor ends the pagination, so it has to be sent back as-is.
        expect(cursors).toEqual([undefined, "page-2-cursor"]);
        // The raw RPC sends base58 strings where web3.js parses PublicKeys, so both
        // paths have to agree on the shape.
        expect(result[0].account.owner).toBeInstanceOf(PublicKey);
      });

      it("maps an RPC error to a NetworkError", async () => {
        mockServer.use(
          http.post(FAKE_CONFIG.endpoint, () =>
            rpcJson({
              error: { code: -32005, message: "Request deprioritized" },
            }),
          ),
        );

        await expect(
          getChainAPI(FAKE_CONFIG).getStakeAccountsByWithdrawAuth(authAddr),
        ).rejects.toBeInstanceOf(NetworkError);
      });

      it("falls back to getProgramAccounts when the endpoint has no V2 method", async () => {
        // devnet, testnet and the local test validator run vanilla agave, which does
        // not implement getProgramAccountsV2.
        const v1Accounts = [{ pubkey: new PublicKey(FIRST_STAKE_ACCOUNT), account: {} }];
        const getParsedProgramAccounts = jest.fn().mockResolvedValue(v1Accounts);
        jest
          .mocked(Connection)
          .mockImplementation(() => ({ getParsedProgramAccounts }) as unknown as Connection);
        mockServer.use(
          http.post(FAKE_CONFIG.endpoint, () =>
            rpcJson({ error: { code: -32601, message: "Method not found" } }),
          ),
        );

        const result = await getChainAPI(FAKE_CONFIG).getStakeAccountsByWithdrawAuth(authAddr);

        expect(result).toBe(v1Accounts);
        expect(getParsedProgramAccounts).toHaveBeenCalledWith(StakeProgram.programId, { filters });
      });
    });
  });
});
