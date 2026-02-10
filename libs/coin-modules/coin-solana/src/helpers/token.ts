import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { AccountLike } from "@ledgerhq/types-live";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { TransferFeeConfigExt } from "../network/chain/account/tokenExtensions";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import {
  SolanaTokenAccount,
  SolanaTokenAccountExtensions,
  SolanaTokenProgram,
  TransferFeeCalculated,
} from "../types";

export async function tokenIsListedOnLedger(currencyId: string, mint: string): Promise<boolean> {
  const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(mint, currencyId);
  return token?.type === "TokenCurrency";
}

export function isTokenAccountFrozen(account: AccountLike): boolean {
  return account.type === "TokenAccount" && (account as SolanaTokenAccount)?.state === "frozen";
}

export function getTokenExtensions(account: AccountLike) {
  return account.type === "TokenAccount" ? (account as SolanaTokenAccount)?.extensions : undefined;
}

export function hasProblematicExtension(extensions: SolanaTokenAccountExtensions) {
  return ["transferFee", "transferHook"].some(extension => extension in extensions);
}

export function getTokenAccountProgramId(program: SolanaTokenProgram): PublicKey {
  return program === PARSED_PROGRAMS.SPL_TOKEN_2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
}

export function isTokenProgram(program: string): boolean {
  return program === PARSED_PROGRAMS.SPL_TOKEN || program === PARSED_PROGRAMS.SPL_TOKEN_2022;
}

export function bpsToPercent(bps: number): number {
  return BigNumber(bps).div(100).toNumber();
}

// https://spl.solana.com/token-2022/extensions#transfer-fees
export function calculateToken2022TransferFees({
  transferAmount,
  transferFeeConfigState,
  currentEpoch,
}: {
  transferAmount: number;
  transferFeeConfigState: Pick<
    TransferFeeConfigExt["state"],
    "newerTransferFee" | "olderTransferFee"
  >;
  currentEpoch: number;
}): TransferFeeCalculated {
  const { newerTransferFee, olderTransferFee } = transferFeeConfigState;
  const transferFeeConfig =
    currentEpoch >= newerTransferFee.epoch ? newerTransferFee : olderTransferFee;

  const { maximumFee, transferFeeBasisPoints } = transferFeeConfig;
  const feePercent = BigNumber(bpsToPercent(transferFeeBasisPoints));
  let transferAmountIncludingFee = BigNumber(transferAmount)
    .div(BigNumber(1).minus(feePercent.div(100)))
    .decimalPlaces(0, BigNumber.ROUND_UP)
    .toNumber();
  let transferFee = transferAmountIncludingFee - transferAmount;

  if (transferFee > maximumFee) {
    transferFee = maximumFee;
    transferAmountIncludingFee = transferAmount + maximumFee;
  }

  return {
    feePercent: feePercent.toNumber(),
    maxTransferFee: maximumFee,
    transferFee,
    feeBps: transferFeeBasisPoints,
    transferAmountIncludingFee,
    transferAmountExcludingFee: BigNumber(transferAmount)
      .minus(transferFee)
      .decimalPlaces(0, BigNumber.ROUND_UP)
      .toNumber(),
  };
}
