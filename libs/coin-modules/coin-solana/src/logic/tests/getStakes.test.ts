import { SYSVAR_STAKE_HISTORY_PUBKEY } from "@solana/web3.js";
import { getStakes } from "../getStakes";
import { server, rpcHandler, createTestChainApi } from "./helpers/msw-rpc.mock";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const VOTER_ADDRESS = "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4";
const STAKE_PUBKEY = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";

const api = createTestChainApi();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function stakeAccountEntry(
  pubkey: string,
  lamports: number,
  opts: {
    voter: string;
    stake: string;
    activationEpoch: string;
    deactivationEpoch: string;
  },
) {
  return {
    pubkey,
    account: {
      lamports,
      data: {
        parsed: {
          type: "delegated",
          info: {
            meta: {
              rentExemptReserve: "2282880",
              authorized: { staker: TEST_ADDRESS, withdrawer: TEST_ADDRESS },
              lockup: { unixTimestamp: 0, epoch: 0, custodian: "11111111111111111111111111111111" },
            },
            stake: {
              delegation: {
                voter: opts.voter,
                stake: opts.stake,
                activationEpoch: opts.activationEpoch,
                deactivationEpoch: opts.deactivationEpoch,
                warmupCooldownRate: 0.09,
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

function stakeHistorySysvar(epoch: number) {
  return {
    data: {
      parsed: {
        type: "stakeHistory",
        info: [
          {
            epoch,
            stakeHistory: {
              effective: 400_000_000_000,
              activating: 1_000_000,
              deactivating: 500_000,
            },
          },
          {
            epoch: epoch - 1,
            stakeHistory: {
              effective: 399_000_000_000,
              activating: 2_000_000,
              deactivating: 1_000_000,
            },
          },
        ],
      },
      program: "stake",
      space: 16392,
    },
    executable: false,
    lamports: 114979200,
    owner: "Sysvar1111111111111111111111111111111111111",
    rentEpoch: 0,
  };
}

function epochInfo(epoch: number) {
  return {
    absoluteSlot: 200_000_000,
    blockHeight: 180_000_000,
    epoch,
    slotIndex: 100_000,
    slotsInEpoch: 432_000,
    transactionCount: 1_000_000_000,
  };
}

const STAKE_HISTORY_ADDRESS = SYSVAR_STAKE_HISTORY_PUBKEY.toBase58();

describe("getStakes (MSW integration)", () => {
  it("should return empty page when no stake accounts exist", async () => {
    server.use(
      rpcHandler({
        getProgramAccounts: () => [],
      }),
    );

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result).toEqual({ items: [] });
  });

  it("should return a fully active delegated stake", async () => {
    const currentEpoch = 350;

    server.use(
      rpcHandler({
        getProgramAccounts: () => [
          stakeAccountEntry(STAKE_PUBKEY, 5_000_000_000, {
            voter: VOTER_ADDRESS,
            stake: "4997717120",
            activationEpoch: "300",
            deactivationEpoch: "18446744073709551615",
          }),
        ],
        getAccountInfo: (params: unknown[]) => {
          if ((params[0] as string) === STAKE_HISTORY_ADDRESS) {
            return { context: { slot: 200_000_000 }, value: stakeHistorySysvar(currentEpoch) };
          }
          return { context: { slot: 200_000_000 }, value: null };
        },
        getEpochInfo: () => epochInfo(currentEpoch),
      }),
    );

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result.items).toHaveLength(1);
    const stake = result.items[0];
    expect(stake.uid).toBe(STAKE_PUBKEY);
    expect(stake.delegate).toBe(VOTER_ADDRESS);
    expect(stake.state).toBe("active");
    expect(stake.asset).toEqual({ type: "native" });
    expect(stake.amount).toBe(BigInt(5_000_000_000));
    expect(stake.amountDeposited).toBe(BigInt(4_997_717_120));
    expect(stake.details?.rentExemptReserve).toBe("2282880");
  });

  it("should return an inactive stake when deactivation epoch has passed", async () => {
    const currentEpoch = 360;

    server.use(
      rpcHandler({
        getProgramAccounts: () => [
          stakeAccountEntry(STAKE_PUBKEY, 5_000_000_000, {
            voter: VOTER_ADDRESS,
            stake: "4997717120",
            activationEpoch: "300",
            deactivationEpoch: "340",
          }),
        ],
        getAccountInfo: (params: unknown[]) => {
          if ((params[0] as string) === STAKE_HISTORY_ADDRESS) {
            return { context: { slot: 200_000_000 }, value: stakeHistorySysvar(currentEpoch) };
          }
          return { context: { slot: 200_000_000 }, value: null };
        },
        getEpochInfo: () => epochInfo(currentEpoch),
      }),
    );

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].state).toBe("inactive");
  });

  it("should propagate RPC errors", async () => {
    server.use(
      rpcHandler({
        getProgramAccounts: () => {
          throw new Error("RPC unavailable");
        },
      }),
    );

    await expect(getStakes(api, TEST_ADDRESS)).rejects.toThrow();
  });
});
