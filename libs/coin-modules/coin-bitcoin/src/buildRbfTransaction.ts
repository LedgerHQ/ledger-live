import * as btc from "bitcoinjs-lib";
import { Transaction } from "bitcoinjs-lib";
import { bitcoinPickingStrategy, UtxoStrategy } from "./types";
import { getWalletAccount, Account as WalletAccount } from "./wallet-btc";
import { Account } from "@ledgerhq/types-live";
import { fromWalletUtxo } from "./synchronisation";
import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
import wallet from "./wallet-btc";
import type { Transaction as BtcTransaction } from "./types";
import { BigNumber } from "bignumber.js";
import { getMinReplacementFeeRateSatVb, RBF_SEQUENCE_THRESHOLD } from "./rbfHelpers";

async function getAmountAndRecipient(tx: Transaction, walletAccount: WalletAccount) {
  const allAddressesSet = new Set<string>();

  const receiving = walletAccount.xpub.storage.getUniquesAddresses({ account: 0 });
  receiving.forEach(a => allAddressesSet.add(a.address));

  const change = walletAccount.xpub.storage.getUniquesAddresses({ account: 1 });
  change.forEach(a => allAddressesSet.add(a.address));

  const network = walletAccount.xpub.crypto.network;

  const externalOutputs = tx.outs
    .map(out => {
      try {
        const address = btc.address.fromOutputScript(out.script, network);
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
    throw new Error("Cannot find recipient (no external outputs found)");
  }
  const recipient = externalOutputs[0].address;

  return { amountSent, recipient };
}

type RbfTxContext = {
  walletAccount: WalletAccount;
  originalTx: Transaction;
  feePerByte: BigNumber;
  networkInfo: Awaited<ReturnType<typeof getAccountNetworkInfo>>;
  changeAddress: Awaited<ReturnType<WalletAccount["xpub"]["getNewAddress"]>>;
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

const resolveFeesStrategy = (
  feePerByte: BigNumber,
  networkInfo: Awaited<ReturnType<typeof getAccountNetworkInfo>>,
) => {
  const fast = networkInfo?.feeItems.items.find(item => item.speed === "fast");
  return fast?.feePerByte && feePerByte.isEqualTo(fast.feePerByte) ? "fast" : "custom";
};

const getRbfContext = async (account: Account, originalTxId: string): Promise<RbfTxContext> => {
  const walletAccount = getWalletAccount(account);
  const hexTx = await walletAccount.xpub.explorer.getTxHex(originalTxId);
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

  const { amountSent, recipient } = await getAmountAndRecipient(originalTx, walletAccount);

  const utxoStrategy: UtxoStrategy = {
    strategy: bitcoinPickingStrategy.RBF_SPEEDUP,
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
  const { feePerByte, networkInfo, changeAddress, excludeUTXOs } = await getRbfContext(
    account,
    originalTxId,
  );

  const utxoStrategy: UtxoStrategy = {
    strategy: bitcoinPickingStrategy.RBF_CANCEL,
    excludeUTXOs,
  };

  return {
    family: "bitcoin",
    recipient: changeAddress.address,
    useAllAmount: true,
    amount: new BigNumber(0),
    feesStrategy: resolveFeesStrategy(feePerByte, networkInfo),
    utxoStrategy,
    rbf: true,
    replaceTxId: originalTxId,
    feePerByte,
    networkInfo,
    changeAddress: changeAddress.address,
  };
}
