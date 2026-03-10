import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import type { ChainAPI } from "../../network";
import { getStakeAccounts } from "../../network/chain/stake-activation/rpc";
import { getStakes } from "../getStakes";

jest.mock("../../network/chain/stake-activation/rpc", () => ({
  getStakeAccounts: jest.fn(),
}));

const mockGetStakeAccounts = getStakeAccounts as jest.Mock;

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const STAKE_PUBKEY = new PublicKey("AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ");
const VOTER_PUBKEY = new PublicKey("EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4");

const api = {} as unknown as ChainAPI;

function makeStakeAccount(overrides?: {
  state?: string;
  lamports?: number;
  active?: number;
  inactive?: number;
}) {
  const {
    state = "active",
    lamports = 5_000_000_000,
    active = 4_997_717_120,
    inactive = 0,
  } = overrides ?? {};

  return {
    account: {
      onChainAcc: {
        pubkey: STAKE_PUBKEY,
        account: { lamports },
      },
      info: {
        meta: {
          rentExemptReserve: new BigNumber(2282880),
          authorized: {
            staker: new PublicKey(TEST_ADDRESS),
            withdrawer: new PublicKey(TEST_ADDRESS),
          },
          lockup: { unixTimestamp: 0, epoch: 0, custodian: PublicKey.default },
        },
        stake: {
          delegation: {
            voter: VOTER_PUBKEY,
            stake: new BigNumber(4_997_717_120),
            activationEpoch: new BigNumber(300),
            deactivationEpoch: new BigNumber("18446744073709551615"),
            warmupCooldownRate: 0.09,
          },
          creditsObserved: 100000,
        },
      },
    },
    activation: { state, active, inactive },
    reward: null,
  };
}

describe("getStakes", () => {
  afterEach(() => jest.clearAllMocks());

  it("should return empty page when no stake accounts", async () => {
    mockGetStakeAccounts.mockResolvedValue([]);

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result).toEqual({ items: [] });
    expect(mockGetStakeAccounts).toHaveBeenCalledWith(api, TEST_ADDRESS);
  });

  it("should map an active delegated stake account", async () => {
    mockGetStakeAccounts.mockResolvedValue([makeStakeAccount()]);

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result.items).toHaveLength(1);
    const stake = result.items[0];
    expect(stake.uid).toBe(STAKE_PUBKEY.toBase58());
    expect(stake.address).toBe(STAKE_PUBKEY.toBase58());
    expect(stake.delegate).toBe(VOTER_PUBKEY.toBase58());
    expect(stake.state).toBe("active");
    expect(stake.asset).toEqual({ type: "native" });
    expect(stake.amount).toBe(BigInt(5_000_000_000));
    expect(stake.amountDeposited).toBe(BigInt(4_997_717_120));
    expect(stake.details?.rentExemptReserve).toBe("2282880");
    expect(stake.details?.activeStake).toBe(4_997_717_120);
  });

  it("should map a deactivating stake account", async () => {
    mockGetStakeAccounts.mockResolvedValue([
      makeStakeAccount({ state: "deactivating", active: 2_000_000_000, inactive: 2_997_717_120 }),
    ]);

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result.items[0].state).toBe("deactivating");
    expect(result.items[0].details?.inactiveStake).toBe(2_997_717_120);
  });

  it("should propagate errors from getStakeAccounts", async () => {
    mockGetStakeAccounts.mockRejectedValue(new Error("RPC error"));

    await expect(getStakes(api, TEST_ADDRESS)).rejects.toThrow("RPC error");
  });
});
