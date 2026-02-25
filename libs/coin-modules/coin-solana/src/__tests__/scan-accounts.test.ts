import BigNumber from "bignumber.js";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import config, { SolanaCoinConfig } from "../config";
import { ChainAPI } from "../network";
import * as stakeActivationModule from "../network/chain/stake-activation/rpc";
import { getAccount, getTokenAccountsTransactions } from "../synchronization";
import {
  publicKeyOf,
  parsedAccountInfo,
  parsedStakeInfo,
  parsedHistoryInfo,
  epochInfo,
  parsedTokenInfo,
  parsedTransaction,
} from "./fixtures/helpers.fixture";

// Module-level mock for getStakeAccounts
const actualGetStakeAccounts = jest.requireActual(
  "../network/chain/stake-activation/rpc",
).getStakeAccounts;
const mockGetStakeAccounts = jest.fn(actualGetStakeAccounts);
jest.mock("../network/chain/stake-activation/rpc", () => ({
  ...jest.requireActual("../network/chain/stake-activation/rpc"),
  getStakeAccounts: (...args: unknown[]) => mockGetStakeAccounts(...args),
}));

describe("Scan account", () => {
  const mockServer = setupServer();

  beforeEach(() => {
    jest.restoreAllMocks();
    mockGetStakeAccounts.mockImplementation(actualGetStakeAccounts);
  });

  it("downloads transactions of the given token accounts", async () => {
    mockServer.listen({ onUnhandledRequest: "error" });
    mockServer.use(
      http.post<never, Array<{ jsonrpc: string; method: string; params: unknown[]; id: string }>>(
        "https://solana.coin.ledger.com",
        async ({ request }) => {
          const body = await request.json();
          const signatures = {
            [publicKeyOf("first-token-account").toBase58()]: [
              publicKeyOf("first-token-account-first-signature"),
            ],
            [publicKeyOf("second-token-account").toBase58()]: [
              publicKeyOf("second-token-account-first-signature"),
              publicKeyOf("second-token-account-second-signature"),
            ],
          };
          const result = body.map(r => {
            const address = r.params[0];
            if (typeof address !== "string") return HttpResponse.json({}, { status: 400 });
            return {
              id: r.id,
              result: signatures[address].map(signature => ({
                signature,
                slot: 4,
                err: null,
                memo: null,
                blockTime: Date.now(),
                confirmationStatus: "confirmed",
              })),
            };
          });
          return HttpResponse.json(result);
        },
      ),
    );
    const api = {
      config: { endpoint: "https://solana.coin.ledger.com" },
      async getParsedTransactions(signatures: string[]) {
        return signatures.map(signature =>
          parsedTransaction({ signature, blockTime: new Date(1741853609668) }),
        );
      },
    } as ChainAPI;

    expect(
      await getTokenAccountsTransactions(
        [
          {
            knownTokenAccount: undefined,
            associatedTokenAccount: {
              info: parsedTokenInfo({ mint: publicKeyOf("mint-one") }),
              onChainAcc: {
                pubkey: publicKeyOf("first-token-account"),
                account: parsedAccountInfo({ type: "account", program: "spl-token" }),
              },
            },
          },
          {
            knownTokenAccount: undefined,
            associatedTokenAccount: {
              info: parsedTokenInfo({ mint: publicKeyOf("mint-two") }),
              onChainAcc: {
                pubkey: publicKeyOf("second-token-account"),
                account: parsedAccountInfo({ type: "account", program: "spl-token" }),
              },
            },
          },
        ],
        api,
      ),
    ).toMatchObject([
      {
        associatedTokenAccountAddress: publicKeyOf("first-token-account").toBase58(),
        mint: publicKeyOf("mint-one").toBase58(),
        descriptors: [
          {
            info: { signature: publicKeyOf("first-token-account-first-signature").toBase58() },
            parsed: { blockTime: 1741853609 },
          },
        ],
      },
      {
        associatedTokenAccountAddress: publicKeyOf("second-token-account").toBase58(),
        mint: publicKeyOf("mint-two").toBase58(),
        descriptors: [
          {
            info: { signature: publicKeyOf("second-token-account-first-signature").toBase58() },
            parsed: { blockTime: 1741853609 },
          },
          {
            info: { signature: publicKeyOf("second-token-account-second-signature").toBase58() },
            parsed: { blockTime: 1741853609 },
          },
        ],
      },
    ]);

    mockServer.close();
  });

  it.each([
    [
      "including token 2022",
      true,
      (f: (addr: string) => unknown) => expect(f).toHaveBeenCalledWith("main-account-address"),
      {
        balance: new BigNumber(50),
        blockHeight: 4,
        tokenAccounts: [
          {
            onChainAcc: {
              pubkey: publicKeyOf("first-spl-token-account"),
              account: { data: { parsed: { type: "account" }, program: "spl-token" } },
            },
          },
          {
            onChainAcc: {
              pubkey: publicKeyOf("second-spl-token-account"),
              account: { data: { parsed: { type: "account" }, program: "spl-token" } },
            },
          },
          {
            onChainAcc: {
              pubkey: publicKeyOf("first-spl-token-2022-account"),
              account: { data: { parsed: { type: "account" }, program: "spl-token-2022" } },
            },
          },
        ],
        stakes: [
          {
            account: {
              onChainAcc: {
                pubkey: publicKeyOf("first-stake-account"),
                account: { data: { parsed: { type: "delegated" }, program: "stake" } },
              },
            },
          },
        ],
      },
    ],
    [
      "excluding token 2022",
      false,
      (f: (addr: string) => unknown) => expect(f).not.toHaveBeenCalled(),
      {
        balance: new BigNumber(50),
        blockHeight: 4,
        tokenAccounts: [
          {
            onChainAcc: {
              pubkey: publicKeyOf("first-spl-token-account"),
              account: { data: { parsed: { type: "account" }, program: "spl-token" } },
            },
          },
          {
            onChainAcc: {
              pubkey: publicKeyOf("second-spl-token-account"),
              account: { data: { parsed: { type: "account" }, program: "spl-token" } },
            },
          },
        ],
        stakes: [
          {
            account: {
              onChainAcc: {
                pubkey: publicKeyOf("first-stake-account"),
                account: { data: { parsed: { type: "delegated" }, program: "stake" } },
              },
            },
          },
        ],
      },
    ],
  ])(
    "retrieves the balance, sub accounts (%s) and stakes from a main address",
    async (_, token2022Enabled, fetchSplToken2022Expectation, expectedAccount) => {
      config.setCoinConfig(() => ({ token2022Enabled }) as SolanaCoinConfig);
      const api = {
        async getBalanceAndContext(_address: string) {
          return { context: { slot: 4 }, value: 50 };
        },
        async getParsedTokenAccountsByOwner(address: string) {
          return {
            context: { slot: 4 },
            value: [
              {
                pubkey: publicKeyOf("first-spl-token-account"),
                account: parsedAccountInfo({
                  lamports: 25000,
                  program: "spl-token",
                  type: "account",
                  info: parsedTokenInfo({ state: "initialized", owner: publicKeyOf(address) }),
                }),
              },
              {
                pubkey: publicKeyOf("second-spl-token-account"),
                account: parsedAccountInfo({
                  lamports: 32000,
                  program: "spl-token",
                  type: "account",
                  info: parsedTokenInfo({ state: "initialized", owner: publicKeyOf(address) }),
                }),
              },
            ],
          };
        },
        async getParsedToken2022AccountsByOwner(address: string) {
          return {
            context: { slot: 4 },
            value: [
              {
                pubkey: publicKeyOf("first-spl-token-2022-account"),
                account: parsedAccountInfo({
                  lamports: 30000,
                  program: "spl-token-2022",
                  type: "account",
                  info: parsedTokenInfo({
                    state: "frozen",
                    owner: publicKeyOf(address),
                    extensions: [{ extension: "immutableOwner" }, { extension: "pausableAccount" }],
                  }),
                }),
              },
            ],
          };
        },
      } as ChainAPI;
      jest.spyOn(api, "getParsedToken2022AccountsByOwner");
      mockGetStakeAccounts.mockResolvedValue([
        {
          account: {
            onChainAcc: {
              pubkey: publicKeyOf("first-stake-account"),
              account: parsedAccountInfo({
                lamports: 25000,
                program: "stake",
                type: "delegated",
              }),
            },
          },
        } as any,
      ]);

      expect(await getAccount("main-account-address", api)).toMatchObject(expectedAccount);
      expect(mockGetStakeAccounts).toHaveBeenCalledWith(api, "main-account-address");
      fetchSplToken2022Expectation(api.getParsedToken2022AccountsByOwner);
    },
  );

  it("fetches staking accounts for an address", async () => {
    const api = {
      async getStakeAccountsByWithdrawAuth(address: string) {
        return [
          {
            pubkey: publicKeyOf("first-stake-account"),
            account: parsedAccountInfo({
              lamports: 25000,
              program: "stake",
              info: parsedStakeInfo({
                stakingCredit: 163673838,
                authorized: {
                  staker: publicKeyOf(address),
                  withdrawer: publicKeyOf(address),
                },
                delegation: {
                  activationEpoch: "545",
                  deactivationEpoch: "694",
                  stake: "212301",
                },
              }),
              type: "delegated",
              owner: publicKeyOf("first-stake-account-owner"),
              executable: false,
            }),
          },
          {
            pubkey: publicKeyOf("second-stake-account"),
            account: parsedAccountInfo({
              lamports: 35000,
              program: "stake",
              info: parsedStakeInfo({
                stakingCredit: 497553656,
                authorized: {
                  staker: publicKeyOf(address),
                  withdrawer: publicKeyOf(address),
                },
                delegation: {
                  activationEpoch: "12",
                  deactivationEpoch: "10",
                  stake: "212301",
                },
              }),
              type: "delegated",
              owner: publicKeyOf("second-stake-account-owner"),
              executable: false,
            }),
          },
        ];
      },
      async getAccountInfo(_address) {
        return parsedAccountInfo({
          lamports: 1135000,
          program: "sysvar",
          info: parsedHistoryInfo({
            minEpoch: 10,
            history: [
              { activating: 4, deactivating: 2, effective: 1 },
              { activating: 14, deactivating: 0, effective: 11 },
              { activating: 24, deactivating: 22, effective: 21 },
            ],
          }),
          type: "stakeHistory",
        });
      },
      async getEpochInfo() {
        return epochInfo({ epoch: 12 });
      },
    } as ChainAPI;

    const getStakeAccountsByWithdrawAuth = jest.spyOn(api, "getStakeAccountsByWithdrawAuth");

    expect(await stakeActivationModule.getStakeAccounts(api, "main-account-address")).toMatchObject(
      [
        {
          account: {
            onChainAcc: {
              pubkey: publicKeyOf("first-stake-account"),
              account: {
                lamports: 25000,
                data: {
                  program: "stake",
                  parsed: {
                    info: {
                      meta: {
                        authorized: {
                          staker: publicKeyOf("main-account-address"),
                          withdrawer: publicKeyOf("main-account-address"),
                        },
                      },
                      stake: {
                        creditsObserved: 163673838,
                      },
                    },
                    type: "delegated",
                  },
                },
                owner: publicKeyOf("first-stake-account-owner"),
                executable: false,
              },
            },
            info: {
              stake: {
                creditsObserved: 163673838,
              },
            },
          },
          activation: {
            state: "inactive",
            active: 0,
            inactive: -8000,
          },
          reward: null,
        },
        {
          account: {
            onChainAcc: {
              pubkey: publicKeyOf("second-stake-account"),
              account: {
                lamports: 35000,
                data: {
                  program: "stake",
                  parsed: {
                    info: {
                      meta: {
                        authorized: {
                          staker: publicKeyOf("main-account-address"),
                          withdrawer: publicKeyOf("main-account-address"),
                        },
                      },
                      stake: {
                        creditsObserved: 497553656,
                      },
                    },
                    type: "delegated",
                  },
                },
                owner: publicKeyOf("second-stake-account-owner"),
                executable: false,
              },
            },
            info: {
              stake: {
                creditsObserved: 497553656,
              },
            },
          },
          activation: {
            state: "inactive",
            active: 0,
            inactive: 2000,
          },
          reward: null,
        },
      ],
    );
    expect(getStakeAccountsByWithdrawAuth).toHaveBeenCalledWith("main-account-address");
  });
});
