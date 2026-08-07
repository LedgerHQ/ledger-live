import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getOperationAmountNumber } from "@ledgerhq/ledger-wallet-framework/operation";
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
import type { SolanaTokenAccount, Transaction } from "./types";

export const estimateFeeAndSpendable = async (
  api: ChainAPI,
  account: Account,
  transaction?: Transaction | undefined | null,
): Promise<{ fee: number; spendable: BigNumber }> => {
  const txKind = transaction?.model.kind ?? "transfer";
  const txFee = await estimateTxFee(api, account.freshAddress, txKind);

  // A synced spendableBalance does not reflect still-pending outgoing txs (pending ops never
  // decrement it and the on-chain balance is not yet confirmed), so subtract pending SOL
  // debits to keep max spendable correct while a previous send is pending. See LIVE-35129.
  //
  // FEES ops are handled separately: a pending token send produces a parent FEES op on the
  // main account whose `value` is the token amount (see optimisticOpForTokenTransfer), so only
  // its SOL `fee` leaves this account. For every other op type getOperationAmountNumber already
  // returns the signed native delta.
  const pendingDebits = (account.pendingOperations ?? []).reduce((sum, op) => {
    const delta = op.type === "FEES" ? op.fee.negated() : getOperationAmountNumber(op);
    return delta.isNegative() ? sum.plus(delta.negated()) : sum;
  }, new BigNumber(0));

  const spendableBalance = BigNumber.max(
    account.spendableBalance.minus(txFee).minus(pendingDebits),
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
