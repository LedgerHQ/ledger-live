/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { PublicKey } from "@solana/web3.js";
import { getBalance } from "../getBalance";
import { server, rpcHandler, createTestChainApi } from "../tests/helpers/msw-rpc.mock";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function emptyTokenAccounts() {
  return { context: { slot: 100 }, value: [] };
}

describe("getBalance (MSW integration)", () => {
  it("should return native balance with locked rent exemption from RPC", async () => {
    server.use(
      rpcHandler({
        getBalance: () => ({ context: { slot: 100 }, value: 2_000_000_000 }),
        getMinimumBalanceForRentExemption: () => 890880,
        getTokenAccountsByOwner: () => emptyTokenAccounts(),
        getProgramAccounts: () => [],
      }),
    );

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toEqual([
      {
        value: 2_000_000_000n,
        asset: { type: "native" },
        locked: 890880n,
      },
    ]);
  });

  it("should clamp locked to value when balance is below rent-exempt minimum", async () => {
    server.use(
      rpcHandler({
        getBalance: () => ({ context: { slot: 100 }, value: 100_000 }),
        getMinimumBalanceForRentExemption: () => 890880,
        getTokenAccountsByOwner: () => emptyTokenAccounts(),
        getProgramAccounts: () => [],
      }),
    );

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toEqual([
      {
        value: 100_000n,
        asset: { type: "native" },
        locked: 100_000n,
      },
    ]);
  });

  it("should propagate RPC errors", async () => {
    server.use(
      rpcHandler({
        getBalance: () => {
          throw new Error("RPC unavailable");
        },
        getMinimumBalanceForRentExemption: () => 890880,
        getTokenAccountsByOwner: () => emptyTokenAccounts(),
        getProgramAccounts: () => [],
      }),
    );

    await expect(getBalance(api, TEST_ADDRESS)).rejects.toThrow(/RPC unavailable/);
  });

  describe("SPL Token balances", () => {
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    function splTokenAccount(mint: string, amount: string) {
      return {
        pubkey: new PublicKey("AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ"),
        account: {
          data: {
            parsed: {
              info: {
                mint,
                owner: TEST_ADDRESS,
                tokenAmount: { amount, decimals: 6, uiAmount: Number(amount) / 1e6 },
              },
              type: "account",
            },
            program: "spl-token",
            space: 165,
          },
          executable: false,
          lamports: 2039280,
          owner: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          rentEpoch: 0,
        },
      };
    }

    it("should return SPL Token balance with value higher than 0", async () => {
      server.use(
        rpcHandler({
          getBalance: () => ({ context: { slot: 100 }, value: 1_000_000_000 }),
          getMinimumBalanceForRentExemption: () => 890880,
          getTokenAccountsByOwner: (params: unknown[]) => {
            const config = params[1] as { programId: string };
            if (config.programId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") {
              return {
                context: { slot: 100 },
                value: [splTokenAccount(USDC_MINT, "5000000")],
              };
            }
            return emptyTokenAccounts();
          },
          getProgramAccounts: () => [],
        }),
      );

      const result = await getBalance(api, TEST_ADDRESS);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        value: 1_000_000_000n,
        asset: { type: "native" },
        locked: 890880n,
      });
      expect(result[1]).toEqual({
        value: 5_000_000n,
        asset: { type: "spl-token", assetReference: USDC_MINT, assetOwner: TEST_ADDRESS },
      });
    });
  });

  describe("Stake account balances", () => {
    const STAKE_PUBKEY = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
    const VOTER_PUBKEY = "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4";

    function stakeAccountRpcEntry(lamports: number) {
      return {
        pubkey: STAKE_PUBKEY,
        account: {
          lamports,
          data: {
            parsed: {
              type: "delegated",
              info: {
                meta: {
                  rentExemptReserve: "2282880",
                  authorized: { staker: TEST_ADDRESS, withdrawer: TEST_ADDRESS },
                  lockup: {
                    unixTimestamp: 0,
                    epoch: 0,
                    custodian: "11111111111111111111111111111111",
                  },
                },
                stake: {
                  delegation: {
                    voter: VOTER_PUBKEY,
                    stake: String(lamports - 2282880),
                    activationEpoch: "300",
                    deactivationEpoch: "18446744073709551615",
                    warmupCooldownRate: 0.25,
                  },
                  creditsObserved: 100000,
                },
              },
            },
            program: "stake",
            space: 200,
          },
          owner: "Stake11111111111111111111111111111111111111",
          executable: false,
          rentEpoch: 0,
        },
      };
    }

    function stakeHistoryAccountInfo() {
      return {
        context: { slot: 100 },
        value: {
          lamports: 1000000,
          data: {
            parsed: {
              type: "stakeHistory",
              info: [
                {
                  epoch: 400,
                  stakeHistory: { effective: 100000000000, activating: 0, deactivating: 0 },
                },
              ],
            },
            program: "stake",
            space: 1000,
          },
          owner: "SysvarStakeHistory1111111111111111111111111",
          executable: false,
          rentEpoch: 0,
        },
      };
    }

    function stakeHandlers(stakeLamports: number) {
      return {
        getBalance: () => ({ context: { slot: 100 }, value: 1_000_000_000 }),
        getMinimumBalanceForRentExemption: () => 890880,
        getTokenAccountsByOwner: () => emptyTokenAccounts(),
        getProgramAccounts: () => [stakeAccountRpcEntry(stakeLamports)],
        getAccountInfo: () => stakeHistoryAccountInfo(),
        getEpochInfo: () => ({
          epoch: 400,
          slotIndex: 100,
          slotsInEpoch: 432000,
          absoluteSlot: 172800100,
          blockHeight: 160000000,
          transactionCount: 0,
        }),
        getLatestBlockhash: () => ({
          context: { slot: 100 },
          value: {
            blockhash: "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3",
            lastValidBlockHeight: 200000000,
          },
        }),
        getFeeForMessage: () => ({ context: { slot: 100 }, value: 5000 }),
        getRecentPrioritizationFees: () => [],
        simulateTransaction: () => ({
          context: { slot: 100 },
          value: { err: null, logs: [], unitsConsumed: 200000 },
        }),
      };
    }

    it("should include staked balance in totalBalance and locked", async () => {
      const stakeLamports = 2_000_000_000;
      server.use(rpcHandler(stakeHandlers(stakeLamports)));

      const result = await getBalance(api, TEST_ADDRESS);

      const native = result[0];
      expect(native.value).toBe(BigInt(1_000_000_000 + stakeLamports));
      expect(native.asset).toEqual({ type: "native" });
      expect(native.locked).toBeGreaterThan(BigInt(890880 + stakeLamports));
    });
  });

  describe("Token-2022 balances", () => {
    const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";

    function token2022Account(mint: string, amount: string) {
      return {
        pubkey: new PublicKey("FvbvvXMY4Rf1AtGG7UHJUesjt8FFgPnPy6o83Dna9mXK"),
        account: {
          data: {
            parsed: {
              info: {
                mint,
                owner: TEST_ADDRESS,
                tokenAmount: { amount, decimals: 6, uiAmount: Number(amount) / 1e6 },
              },
              type: "account",
            },
            program: "spl-token-2022",
            space: 165,
          },
          executable: false,
          lamports: 2039280,
          owner: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
          rentEpoch: 0,
        },
      };
    }

    it("should return Token-2022 balance with value higher than 0", async () => {
      server.use(
        rpcHandler({
          getBalance: () => ({ context: { slot: 100 }, value: 1_000_000_000 }),
          getMinimumBalanceForRentExemption: () => 890880,
          getTokenAccountsByOwner: (params: unknown[]) => {
            const config = params[1] as { programId: string };
            if (config.programId === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") {
              return {
                context: { slot: 100 },
                value: [token2022Account(PYUSD_MINT, "10000000")],
              };
            }
            return emptyTokenAccounts();
          },
          getProgramAccounts: () => [],
        }),
      );

      const result = await getBalance(api, TEST_ADDRESS, { token2022Enabled: true });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        value: 1_000_000_000n,
        asset: { type: "native" },
        locked: 890880n,
      });
      expect(result[1]).toEqual({
        value: 10_000_000n,
        asset: { type: "spl-token-2022", assetReference: PYUSD_MINT, assetOwner: TEST_ADDRESS },
      });
    });
  });
});
