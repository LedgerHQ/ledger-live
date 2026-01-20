import { BigNumber } from "bignumber.js";
import { Transaction } from "bitcoinjs-lib";
import { bitcoinPickingStrategy, UtxoStrategy } from "./types";
import wallet, { getWalletAccount, Account as WalletAccount } from "./wallet-btc";
import { Account } from "@ledgerhq/types-live";
import { fromWalletUtxo } from "./synchronisation";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import type { Transaction as BtcTransaction, NetworkInfo } from "./types";
import { getMinReplacementFeeRateSatVb, RBF_SEQUENCE_THRESHOLD } from "./rbfHelpers";
import { Address } from "./wallet-btc/storage/types";
import { scriptToAddress } from "./wallet-btc/utils";

async function getAmountAndRecipient(
  tx: Transaction,
  walletAccount: WalletAccount,
  knownRecipient?: string,
) {
  const network = walletAccount.xpub.crypto.network;
  // If we already know the recipient from the pending transaction,
  // use it directly to find the correct output
  if (knownRecipient) {
    const recipientOutput = tx.outs.find(out => {
      try {
        const address = scriptToAddress(out.script, network);
        return address === knownRecipient;
      } catch {
        return false;
      }
    });

    if (recipientOutput) {
      return { amountSent: recipientOutput.value, recipient: knownRecipient };
    }
  }

  // Fallback: identify external outputs by checking against known wallet addresses
  const allAddressesSet = new Set<string>();

  const receiving = walletAccount.xpub.storage.getUniquesAddresses({ account: 0 });
  receiving.forEach(a => allAddressesSet.add(a.address));

  const change = walletAccount.xpub.storage.getUniquesAddresses({ account: 1 });
  change.forEach(a => allAddressesSet.add(a.address));

  const externalOutputs = tx.outs
    .map(out => {
      try {
        const address = scriptToAddress(out.script, network);
        return { address, value: out.value };
      } catch {
        return null;
      }
    })
    .filter(
      (o): o is { address: string; value: number } => o !== null && !allAddressesSet.has(o.address),
    );

  const amountSent = externalOutputs.reduce((sum, out) => sum + out.value, 0);
  if (externalOutputs.length === 0) {
    return { amountSent: 0, recipient: "" };
  }
  const recipient = externalOutputs[0].address;

  return { amountSent, recipient };
}

type RbfTxContext = {
  walletAccount: WalletAccount;
  originalTx: Transaction;
  feePerByte: BigNumber;
  networkInfo: NetworkInfo;
  changeAddress: Address;
  excludeUTXOs: Array<{ hash: string; outputIndex: number }>;
};

const assertRbfEnabled = (originalTx: Transaction) => {
  if (!originalTx.ins.some(i => i.sequence < RBF_SEQUENCE_THRESHOLD)) {
    throw new Error("Transaction is not RBF-enabled");
  }
};

const buildExcludeUtxos = async (walletAccount: WalletAccount) => {
  const changeAddrs = new Set(
    walletAccount.xpub.storage.getUniquesAddresses({ account: 1 }).map(a => a.address),
  );

  const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
  const walletUtxos = rawUtxos.map(u => fromWalletUtxo(u, changeAddrs));

  return walletUtxos
    .filter(u => u.blockHeight === null && u.isChange)
    .map(u => ({ hash: u.hash, outputIndex: u.outputIndex }));
};

const resolveFeesStrategy = (feePerByte: BigNumber, networkInfo: NetworkInfo) => {
  const fast = networkInfo?.feeItems.items.find(item => item.speed === "fast");
  return fast?.feePerByte && feePerByte.isEqualTo(fast.feePerByte) ? "fast" : "custom";
};

const getRbfContext = async (account: Account, originalTxId: string): Promise<RbfTxContext> => {
  const walletAccount = getWalletAccount(account);
  let hexTx: string;
  try {
    hexTx = await walletAccount.xpub.explorer.getTxHex(originalTxId);
<<<<<<< HEAD
  } catch {
    throw new Error(`Original transaction ${originalTxId} could not be fetched`);
=======
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Check if this transaction was recently confirmed or replaced
    const confirmedTx = account.operations.find(op => op.hash === originalTxId);
    if (confirmedTx && confirmedTx.blockHeight) {
      throw new Error(
        `Transaction ${originalTxId.slice(0, 8)}... has already been confirmed in block ${confirmedTx.blockHeight}. Confirmed transactions cannot be replaced.`,
      );
    }
    throw new Error(
      `Transaction ${originalTxId.slice(0, 8)}... not found. It may have been replaced by another transaction or is not yet available from the explorer. Please wait a moment and try again.`,
    );
>>>>>>> f2b1733916 (fix: rbf should work but sychonise test must fail)
  }

  const originalTx = Transaction.fromHex(hexTx);
  assertRbfEnabled(originalTx);

  const minFeeRateSatVb = await getMinReplacementFeeRateSatVb({
    account,
    originalTxId,
  });

  const feePerByte = minFeeRateSatVb.integerValue(BigNumber.ROUND_CEIL);
  const excludeUTXOs = await buildExcludeUtxos(walletAccount);
  const networkInfo = await getAccountNetworkInfo(account);
  const changeAddress = await walletAccount.xpub.getNewAddress(1, 1);

  return {
    walletAccount,
    originalTx,
    feePerByte,
    networkInfo,
    changeAddress,
    excludeUTXOs,
  };
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
  const { amountSent } = await getAmountAndRecipient(originalTx, walletAccount, originalRecipient);

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
