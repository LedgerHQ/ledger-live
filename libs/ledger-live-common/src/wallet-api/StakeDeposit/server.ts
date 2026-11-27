import { z } from "zod";
import { log } from "@ledgerhq/logs";
import type { AccountLike } from "@ledgerhq/types-live";
import { createAccountNotFound, createUnknownError, ServerError } from "@ledgerhq/wallet-api-core";
import { customWrapper } from "@ledgerhq/wallet-api-server";
import {
  estimateSolanaStakeDepositMax,
  SolanaStakeDepositEstimateError,
} from "../../families/solana/stakeDepositEstimate";
import { getAccountIdFromWalletAccountId } from "../converters";

export type StakeDepositEstimateParams = {
  /** The Wallet API id of the Solana main account the deposit spends from. */
  accountId: string;
};

export type StakeDepositEstimateResult = {
  /** Lamports, as a string of digits: the largest amount a `stake.createAccount` can carry now. */
  maxAmount: string;
};

const SOLANA_CURRENCY_ID = "solana";

const StakeDepositEstimateParamsSchema = z.object({ accountId: z.string().min(1) });

function failure(message: string): ServerError {
  return new ServerError(createUnknownError({ message }));
}

export const handlers = ({ accounts }: { accounts: AccountLike[] }) => {
  const findSolanaMainAccount = (walletAccountId: string) => {
    const accountId = getAccountIdFromWalletAccountId(walletAccountId);
    const account = accounts.find(item => item.id === accountId);
    if (!account) throw new ServerError(createAccountNotFound(walletAccountId));
    if (account.type !== "Account" || account.currency.id !== SOLANA_CURRENCY_ID) {
      throw failure("the account must be a Solana main account");
    }
    return account;
  };

  return {
    "custom.stake.deposit.estimate": customWrapper<
      StakeDepositEstimateParams,
      StakeDepositEstimateResult
    >(async params => {
      const parsed = StakeDepositEstimateParamsSchema.safeParse(params);
      if (!parsed.success) throw failure("invalid params");
      const account = findSolanaMainAccount(parsed.data.accountId);

      try {
        const maxAmount = await estimateSolanaStakeDepositMax(account);
        return { maxAmount: maxAmount.toFixed(0) };
      } catch (error) {
        const reason =
          error instanceof SolanaStakeDepositEstimateError ? error.reason : "estimation_failed";
        log("stake-deposit-estimate", "the estimate is unavailable", { reason });
        throw failure(`the stake deposit estimate is unavailable (${reason})`);
      }
    }),
  } as const;
};
