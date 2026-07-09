/**
 * EVM earn family adapter — maps the generic command arguments onto the ETH vault pipeline
 * (depositEvm / withdrawEvm) and enforces the EVM-specific required flags.
 */

import { depositEvm, withdrawEvm } from "../eth-vault-pipeline";
import type { EarnDepositResult, EarnWithdrawResult } from "../types";
import type { EarnDepositArgs, EarnFamilyAdapter, EarnWithdrawArgs } from "./index";

export const evmEarnAdapter: EarnFamilyAdapter = {
  deposit(args: EarnDepositArgs): Promise<EarnDepositResult> {
    return depositEvm({
      descriptor: args.descriptor,
      network: args.network,
      productId: args.product,
      amount: args.amount,
      dryRun: args.dryRun,
      wallet: args.wallet,
      out: args.out,
      device: args.device,
    });
  },

  withdraw(args: EarnWithdrawArgs): Promise<EarnWithdrawResult> {
    if (!args.product) {
      throw new Error("EVM withdraw requires --product <vault-id>.");
    }
    return withdrawEvm({
      descriptor: args.descriptor,
      network: args.network,
      productId: args.product,
      amount: args.amount,
      dryRun: args.dryRun,
      wallet: args.wallet,
      out: args.out,
      device: args.device,
    });
  },
};
