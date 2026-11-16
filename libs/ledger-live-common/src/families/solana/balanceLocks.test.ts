import BigNumber from "bignumber.js";
import { createEmptyStakingResources, type StakingAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import solanaBalanceLocks from "./balanceLocks";

const solana = (stakingResources: StakingAccount["stakingResources"]): StakingAccount => ({
  ...genAccount("sol", { currency: getCryptoCurrencyById("solana") }),
  stakingResources,
});

const position = { validatorAddress: "v", amount: new BigNumber(1000) };

describe("solanaBalanceLocks", () => {
  it("sums the unstake reserve and each stake account's rent-exempt reserve", () => {
    const account = solana({
      ...createEmptyStakingResources(),
      actionFeeReserve: new BigNumber(5),
      delegations: [
        {
          ...position,
          pendingRewards: new BigNumber(0),
          status: "bonded",
          lockedReserve: new BigNumber(20),
        },
      ],
      unbondings: [{ ...position, completionDate: new Date(0), lockedReserve: new BigNumber(30) }],
    });
    expect(solanaBalanceLocks(account)).toEqual([{ reason: "reserve", amount: "55" }]);
  });

  it("answers no lock without any reserve", () => {
    expect(solanaBalanceLocks(solana(createEmptyStakingResources()))).toEqual([]);
  });

  it("answers no lock for an account without staking resources", () => {
    expect(
      solanaBalanceLocks(genAccount("eth", { currency: getCryptoCurrencyById("ethereum") })),
    ).toEqual([]);
  });
});
