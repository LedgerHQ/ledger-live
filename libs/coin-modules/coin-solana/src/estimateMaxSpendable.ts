import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { calculateToken2022TransferFees } from "./helpers/token";
import { estimateTxFee } from "./logic/estimateFees";
import { ChainAPI } from "./network";
import { TransferFeeConfigExt } from "./network/chain/account/tokenExtensions";
import {
  getMaybeTokenMint,
  getStakeAccountMinimumBalanceForRentExemption,
} from "./network/chain/web3";
import type { SolanaAccount, SolanaTokenAccount, Transaction } from "./types";

export const estimateFeeAndSpendable = async (
  api: ChainAPI,
  account: Account,
  transaction?: Transaction | undefined | null,
): Promise<{ fee: number; spendable: BigNumber }> => {
  const txKind = transaction?.model.kind ?? "transfer";

  // Fetch the live on-chain balance instead of relying on the synced
  // account.spendableBalance, which can be stale (e.g. right after a swap/send).
  const [txFee, onChainLamports, rentExemptMin] = await Promise.all([
    estimateTxFee(api, account.freshAddress, txKind),
    api.getBalance(account.freshAddress),
    api.getMinimumBalanceForRentExemption(0),
  ]);

  // Re-apply the same reservations sync does (balance − rentExempt − unstakeReserve)
  // to the freshly fetched balance, then subtract the fee. Reading the live on-chain
  // balance is fresher than the synced account.spendableBalance (which only updates on
  // the next full sync): it already reflects any outflow confirmed on-chain, without
  // waiting for the app's periodic re-sync.
  const onChainBalance = new BigNumber(onChainLamports);
  const rentExempt = new BigNumber(rentExemptMin);
  const unstakeReserve =
    (account as SolanaAccount).solanaResources?.unstakeReserve ?? new BigNumber(0);
  const spendableBalance = BigNumber.max(
    onChainBalance.minus(rentExempt).minus(unstakeReserve).minus(txFee),
    0,
  );

  switch (txKind) {
    case "token.createATA": {
      const assocAccRentExempt = await api.getAssocTokenAccMinNativeBalance();

      return {
        fee: txFee + assocAccRentExempt,
        spendable: BigNumber.max(spendableBalance.minus(assocAccRentExempt), 0),
      };
    }
    case "stake.createAccount": {
      const [stakeAccRentExempt, undelegateFee, withdrawFee] = await Promise.all([
        getStakeAccountMinimumBalanceForRentExemption(api),
        estimateTxFee(api, account.freshAddress, "stake.undelegate"),
        estimateTxFee(api, account.freshAddress, "stake.withdraw"),
      ]);

      return {
        fee: txFee + stakeAccRentExempt,
        spendable: BigNumber.max(
          spendableBalance.minus(stakeAccRentExempt).minus(undelegateFee + withdrawFee),
          0,
        ),
      };
    }

    default: {
      return {
        fee: txFee,
        spendable: spendableBalance,
      };
    }
  }
};

function isTransferTx(tx: Transaction | undefined | null): boolean {
  return !!tx && (tx.model.kind === "token.transfer" || tx.model.kind === "transfer");
}

export async function estimateTokenMaxSpendable(
  api: ChainAPI,
  account: SolanaTokenAccount,
  tx?: Transaction | undefined | null,
) {
  if (
    isTransferTx(tx) &&
    account.extensions?.transferFee &&
    account.extensions.transferFee.feeBps > 0
  ) {
    const mint = await getMaybeTokenMint(account.token.contractAddress, api);
    if (!mint || mint instanceof Error) return account.spendableBalance;
    const transferFeeConfig = mint.info.extensions?.find(
      ext => ext.extension === "transferFeeConfig",
    ) as TransferFeeConfigExt;
    if (!transferFeeConfig) return account.spendableBalance;

    const { epoch } = await api.getEpochInfo();

    const { transferAmountExcludingFee } = calculateToken2022TransferFees({
      transferAmount: account.spendableBalance.toNumber(),
      transferFeeConfigState: transferFeeConfig.state,
      currentEpoch: epoch,
    });
    return BigNumber(transferAmountExcludingFee);
  }

  return account.spendableBalance;
}

export const estimateMaxSpendableWithAPI = async (
  {
    account,
    parentAccount,
    transaction,
  }: Parameters<AccountBridge<Transaction>["estimateMaxSpendable"]>[0],
  api: ChainAPI,
): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
  switch (account.type) {
    case "Account":
      return (await estimateFeeAndSpendable(api, mainAccount, transaction)).spendable;
    case "TokenAccount":
      return estimateTokenMaxSpendable(api, account, transaction);
  }
};

export default estimateMaxSpendableWithAPI;
