import BigNumber from "bignumber.js";
import type { StakingTransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { validateIntent } from "@ledgerhq/coin-solana/logic/validateIntent";
import type { ChainAPI } from "@ledgerhq/coin-solana/network/index";
import type { Account } from "@ledgerhq/types-live";
import { extractBalances } from "../../../bridge/generic-coin-framework/utils";

const OWNER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const STAKE_ACCOUNT = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";

const undelegate: StakingTransactionIntent = {
  intentType: "staking",
  type: "stake.undelegate",
  mode: "undelegate",
  sender: OWNER,
  recipient: STAKE_ACCOUNT,
  valAddress: "",
  amount: 0n,
  asset: { type: "native", name: "Solana" },
};

function accountHoldingLamports(systemLamports: number): Account {
  return {
    balance: new BigNumber(systemLamports + 2_002_282_880),
    spendableBalance: new BigNumber(0),
    freshAddress: OWNER,
    pendingOperations: [],
    stakingResources: {
      delegations: [
        {
          positionId: STAKE_ACCOUNT,
          validatorAddress: "vote-acc",
          amount: new BigNumber(2_000_000_000),
          pendingRewards: new BigNumber(0),
          status: "bonded",
          activeAmount: new BigNumber(2_000_000_000),
          inactiveAmount: new BigNumber(0),
          lockedReserve: new BigNumber(2_282_880),
          canStake: true,
          canWithdraw: true,
        },
      ],
      unbondings: [],
    },
  } as unknown as Account;
}

describe("validateIntent on the balances rebuilt from a synced Solana account", () => {
  it("does not let the stake account's lamports pay the undelegate fee when the wallet account holds 3000", async () => {
    const result = await validateIntent(
      {} as unknown as ChainAPI,
      undelegate,
      extractBalances(accountHoldingLamports(3_000), undefined, true),
      { value: 5000n },
    );

    expect(result.errors.fee).toBeInstanceOf(NotEnoughBalance);
  });

  it("accepts the undelegate fee when the wallet account holds enough to pay it", async () => {
    const result = await validateIntent(
      {} as unknown as ChainAPI,
      undelegate,
      extractBalances(accountHoldingLamports(10_000), undefined, true),
      { value: 5000n },
    );

    expect(result.errors).toEqual({});
  });
});
