import { BigNumber } from "bignumber.js";
import { bitcoinPickingStrategy, UtxoStrategy } from "@ledgerhq/coin-bitcoin/types";
import type { Transaction as BtcTransaction, NetworkInfo } from "@ledgerhq/coin-bitcoin/types";
import { getAmountAndRecipient, getRbfContext } from "@ledgerhq/coin-bitcoin/rbfContext";
import { Account } from "@ledgerhq/types-live";

const resolveFeesStrategy = (feePerByte: BigNumber, networkInfo: NetworkInfo) => {
  const fast = networkInfo?.feeItems.items.find(item => item.speed === "fast");
  return fast?.feePerByte && feePerByte.isEqualTo(fast.feePerByte) ? "fast" : "custom";
};

export async function buildRbfSpeedUpTx(
  account: Account,
  originalTxId: string,
): Promise<BtcTransaction> {
  const { walletAccount, originalTx, feePerByte, networkInfo, changeAddress, excludeUTXOs } =
    await getRbfContext(account, originalTxId);

  // Try to find the pending operation to get the known recipient
  const pendingOp = account.pendingOperations.find(op => op.hash === originalTxId);
  const knownRecipient = pendingOp?.recipients?.[0];

  const { amountSent, recipient } = await getAmountAndRecipient(
    originalTx,
    walletAccount,
    knownRecipient,
  );

  const utxoStrategy: UtxoStrategy = {
    strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
    excludeUTXOs,
  };

  return {
    family: "bitcoin",
    recipient,
    amount: new BigNumber(amountSent),
    feesStrategy: resolveFeesStrategy(feePerByte, networkInfo),
    utxoStrategy,
    rbf: true,
    replaceTxId: originalTxId,
    feePerByte,
    networkInfo,
    changeAddress: changeAddress.address,
  };
}

export async function buildRbfCancelTx(
  account: Account,
  originalTxId: string,
): Promise<BtcTransaction> {
  const { walletAccount, originalTx, feePerByte, networkInfo, changeAddress, excludeUTXOs } =
    await getRbfContext(account, originalTxId);

  // Get the original external recipient from the pending operation
  const pendingOp = account.pendingOperations.find(op => op.hash === originalTxId);
  const originalRecipient = pendingOp?.recipients?.[0];

  // Get the amount sent to the external recipient (not including change)
  const { amountSent: detectedAmountSent } = await getAmountAndRecipient(
    originalTx,
    walletAccount,
    originalRecipient,
  );
  // Cancel-of-cancel may have no external output and no persisted recipient.
  // In that case, preserve editable intent by using the first spendable output amount.
  const fallbackAmountFromFirstSpendableOutput =
    originalTx.outs.find(out => out.value > 0)?.value ?? 0;
  const amountSent =
    detectedAmountSent > 0 ? detectedAmountSent : fallbackAmountFromFirstSpendableOutput;

  const utxoStrategy: UtxoStrategy = {
    strategy: bitcoinPickingStrategy.OPTIMIZE_SIZE,
    excludeUTXOs,
  };

  return {
    family: "bitcoin",
    recipient: changeAddress.address,
    amount: new BigNumber(amountSent),
    feesStrategy: resolveFeesStrategy(feePerByte, networkInfo),
    utxoStrategy,
    rbf: true,
    replaceTxId: originalTxId,
    feePerByte,
    networkInfo,
    changeAddress: changeAddress.address,
  };
}
