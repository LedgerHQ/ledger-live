import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { StacksAccount, StakingPosition } from "@ledgerhq/live-common/families/stacks/types";

// Real, checksum-valid mainnet address (also used by live-common's stacks react.test.ts).
export const POOL_ADDRESS = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA.native-pool-signer-manager";

export const makeStakingPosition = (overrides: Partial<StakingPosition> = {}): StakingPosition =>
  ({
    uid: "SP1staker",
    address: "SP1staker",
    delegate: POOL_ADDRESS,
    state: "active",
    asset: { type: "native" },
    amount: new BigNumber(5_000_000),
    actions: ["undelegate"],
    details: {
      firstRewardCycle: 42,
      numCycles: 6,
      rewardAsset: "sbtc",
      amountRewarded: "0",
    },
    ...overrides,
  }) as StakingPosition;

export const makeStacksAccount = (
  overrides: Partial<StacksAccount> = {},
  // `null` omits the key entirely -- what synchronization does when the stake lookup failed.
  stakingPositions: StakingPosition[] | null = [],
): StacksAccount => {
  const account: StacksAccount = {
    ...genAccount("stacks-staking-test", { currency: getCryptoCurrencyById("stacks") }),
    spendableBalance: new BigNumber(10_000_000),
    balance: new BigNumber(10_000_000),
    ...overrides,
  };
  if (stakingPositions === null) {
    delete account.stakingPositions;
  } else {
    account.stakingPositions = stakingPositions;
  }
  return account;
};
