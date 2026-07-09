/**
 * Solana earn family adapter — maps the generic command arguments onto the native staking pipeline
 * (depositSolana / withdrawSolana) and enforces the Solana-specific required flags. The partial
 * `--amount` rejection lives in withdrawSolana, so the adapter only guards `--stake-account` here.
 */

import { depositSolana, withdrawSolana } from "../sol-stake";
import type { EarnDepositResult, EarnWithdrawResult } from "../types";
import type { EarnDepositArgs, EarnFamilyAdapter, EarnWithdrawArgs } from "./index";

export const solanaEarnAdapter: EarnFamilyAdapter = {
  deposit(args: EarnDepositArgs): Promise<EarnDepositResult> {
    return depositSolana({
      descriptor: args.descriptor,
      network: args.network,
      validator: args.product,
      amount: args.amount,
      dryRun: args.dryRun,
      wallet: args.wallet,
      out: args.out,
      device: args.device,
    });
  },

  withdraw(args: EarnWithdrawArgs): Promise<EarnWithdrawResult> {
    if (!args.stakeAccount) {
      throw new Error("Solana withdraw requires --stake-account <address>.");
    }
    return withdrawSolana({
      descriptor: args.descriptor,
      network: args.network,
      stakeAccount: args.stakeAccount,
      amount: args.amount,
      finalize: args.finalize,
      dryRun: args.dryRun,
      wallet: args.wallet,
      out: args.out,
      device: args.device,
    });
  },
};
