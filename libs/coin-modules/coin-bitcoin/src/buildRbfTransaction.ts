// import * as btc from "bitcoinjs-lib";
// import { Transaction } from "bitcoinjs-lib";
// import { bitcoinPickingStrategy, UtxoStrategy } from "./types";
// import { BitcoinAccount, BtcOperation } from "./types";
// import { getWalletAccount, Account as WalletAccount } from "./wallet-btc";
// import { Account } from "@ledgerhq/types-live";
// import { fromWalletUtxo } from "./synchronisation";
// import { getAccountNetworkInfo } from "./getAccountNetworkInfo";
// import wallet from "./wallet-btc";
// import type { Transaction as BtcTransaction } from "./types";
// import { BigNumber } from "bignumber.js";
// import { getIncrementalFeeFloorSatVb } from "./wallet-btc/utils";

// async function getAmountAndRecipient(tx: Transaction, walletAccount: WalletAccount) {
//   // 1. Collect all known addresses for this account
//   const allAddressesSet = new Set<string>();

//   const receiving = await walletAccount.xpub.storage.getUniquesAddresses({ account: 0 });
//   receiving.forEach(a => allAddressesSet.add(a.address));

//   const change = await walletAccount.xpub.storage.getUniquesAddresses({ account: 1 });
//   change.forEach(a => allAddressesSet.add(a.address));

//   // 2. Decode outputs and detect which are NOT ours
//   const network = walletAccount.xpub.crypto.network;

//   const externalOutputs = tx.outs
//     .map(out => {
//       try {
//         const address = btc.address.fromOutputScript(out.script, network);
//         return { address, value: out.value };
//       } catch {
//         return null; // skip OP_RETURN etc.
//       }
//     })
//     .filter(
//       (o): o is { address: string; value: number } => o !== null && !allAddressesSet.has(o.address),
//     );

//   const amountSent = externalOutputs.reduce((sum, out) => sum + out.value, 0);
//   // Determine recipient (first external output)
//   if (externalOutputs.length === 0) {
//     throw new Error("Cannot find recipient (no external outputs found)");
//   }
//   const recipient = externalOutputs[0].address;

//   // 3. Sum external outputs => amount sent
//   return { amountSent, recipient };
// }

// export async function getUtxoValue(
//   walletAccount: WalletAccount,
//   txid: string,
//   index: number,
// ): Promise<number> {
//   // 1. Fetch raw hex
//   const rawHex = await walletAccount.xpub.explorer.getTxHex(txid);

//   // 2. Decode with bitcoinjs-lib
//   const tx = Transaction.fromHex(rawHex);

//   // 3. Read the output value
//   const output = tx.outs[index];
//   if (!output) throw new Error(`Output index ${index} does not exist`);

//   return output.value; // value is in sats
// }

// export async function buildRbfTx(account: Account, originalTxId: string): Promise<BtcTransaction> {
//   const walletAccount = getWalletAccount(account);

//   // 1️⃣ Load original transaction
//   const hexTx = await walletAccount.xpub.explorer.getTxHex(originalTxId);
//   const originalTx = Transaction.fromHex(hexTx);

//   // 2️⃣ Ensure RBF is enabled
//   if (!originalTx.ins.some(i => i.sequence < 0xfffffffe)) {
//     throw new Error("Transaction is not RBF-enabled");
//   }

//   // 3️⃣ Extract original inputs (MUST overlap)
//   const originalInputs = originalTx.ins.map(input => ({
//     hash: Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex"),
//     outputIndex: input.index,
//   }));
//   console.log("Original inputs:", originalInputs);

//   // 4️⃣ Extract recipient + amount
//   const { amountSent, recipient } = await getAmountAndRecipient(originalTx, walletAccount);

//   // 5️⃣ Compute new fee rate
//   const inputValues = await Promise.all(
//     originalTx.ins.map(async input => {
//       const txid = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");
//       return getUtxoValue(walletAccount, txid, input.index);
//     }),
//   );

//   const totalInput = inputValues.reduce((a, b) => a + b, 0);
//   const totalOutput = originalTx.outs.reduce((a, o) => a + o.value, 0);

//   const oldFee = totalInput - totalOutput;
//   const vsize = originalTx.virtualSize();
//   const oldFeeRate = oldFee / vsize; // sat/vB (float)

//   const minIncrement = await getIncrementalFeeFloorSatVb(walletAccount.xpub.explorer); // sat/vB

//   const newFeeRate = Math.ceil(oldFeeRate + minIncrement.toNumber());

//   // 6️⃣ Fetch wallet UTXOs
//   const changeAddrs = new Set(
//     (await walletAccount.xpub.storage.getUniquesAddresses({ account: 1 })).map(a => a.address),
//   );

//   const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
//   const walletUtxos = rawUtxos.map(u => fromWalletUtxo(u, changeAddrs));

//   // 7️⃣ Force reuse of ORIGINAL inputs (Ledger Live RBF rule)
//   const originalSet = new Set(originalInputs.map(i => `${i.hash}:${i.outputIndex}`));
//   const excludeUTXOs = walletUtxos
//     .filter(u => u.blockHeight === null && u.isChange)
//     .map(u => ({
//       hash: u.hash,
//       outputIndex: u.outputIndex,
//     }));

//   console.log("Original inputs forced for RBF:", [...originalSet]);
//   console.log("Excluded UTXOs for RBF:", excludeUTXOs);

//   // 8️⃣ UTXO strategy (Ledger Live enforces overlap)
//   const utxoStrategy: UtxoStrategy = {
//     strategy: bitcoinPickingStrategy.RBF_SPEEDUP,
//     excludeUTXOs,
//   };
//   // console.log("Excluded UTXOs for RBF:", excludeUTXOs);

//   const networkInfo = await getAccountNetworkInfo(account);
//   const changeAddress = await walletAccount.xpub.getNewAddress(1, 1);
//   const speed = networkInfo?.feeItems.items.find(item => "fast" === item.speed);

//   const shouldUseFastStrategy =
//     newFeeRate && speed?.feePerByte ? new BigNumber(newFeeRate).isEqualTo(speed.feePerByte) : false;

//   // 9️⃣ Build RBF transaction
//   return {
//     family: "bitcoin",
//     recipient,
//     amount: new BigNumber(amountSent),
//     feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
//     utxoStrategy,
//     rbf: true,
//     replaceTxId: originalTxId,
//     feePerByte: new BigNumber(newFeeRate),
//     networkInfo,
//     changeAddress: changeAddress.address,
//   };
// }

// export async function checkTXID(account: Account, txid1: string, txid2: string): Promise<boolean> {
//   const walletAccount = getWalletAccount(account);
//   // 1️⃣ Fetch original transaction hex
//   const hexTx1 = await walletAccount.xpub.explorer.getTxHex(txid1);
//   const tx1 = Transaction.fromHex(hexTx1);

//   const hexTx2 = await walletAccount.xpub.explorer.getTxHex(txid2);
//   const tx2 = Transaction.fromHex(hexTx2);

//   const tx1Inputs = tx1.ins.map(input => {
//     const txid = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");
//     const vout = input.index;
//     return `${txid}:${vout}`;
//   });
//   console.log("TX1 Inputs:", tx1Inputs);

//   const tx2Inputs = tx2.ins.map(input => {
//     const txid = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");
//     const vout = input.index;
//     return `${txid}:${vout}`;
//   });
//   console.log("TX2 Inputs:", tx2Inputs);
//   const sharedInputs = tx1Inputs.filter(i => tx2Inputs.includes(i));

//   if (sharedInputs.length > 0) {
//     console.log("Transactions share input(s):", sharedInputs);
//     return true;
//   } else {
//     console.log("Transactions do NOT share any inputs");
//     return false;
//   }
// }

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

  const receiving = await walletAccount.xpub.storage.getUniquesAddresses({ account: 0 });
  receiving.forEach(a => allAddressesSet.add(a.address));

  const change = await walletAccount.xpub.storage.getUniquesAddresses({ account: 1 });
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

export async function buildRbfTx(account: Account, originalTxId: string): Promise<BtcTransaction> {
  const walletAccount = getWalletAccount(account);
  console.log("buildRbfTx THE ACCOUNT:", account);
  const hexTx = await walletAccount.xpub.explorer.getTxHex(originalTxId);
  const originalTx = Transaction.fromHex(hexTx);

  if (!originalTx.ins.some(i => i.sequence < RBF_SEQUENCE_THRESHOLD)) {
    throw new Error("Transaction is not RBF-enabled");
  }

  const { amountSent, recipient } = await getAmountAndRecipient(originalTx, walletAccount);

  const minFeeRateSatVb = await getMinReplacementFeeRateSatVb({
    account,
    originalTxId,
  });

  const feePerByte = minFeeRateSatVb.integerValue(BigNumber.ROUND_CEIL);

  // Fetch wallet UTXOs
  const changeAddrs = new Set(
    walletAccount.xpub.storage.getUniquesAddresses({ account: 1 }).map(a => a.address),
  );

  const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
  const walletUtxos = rawUtxos.map(u => fromWalletUtxo(u, changeAddrs));

  const excludeUTXOs = walletUtxos
    .filter(u => u.blockHeight === null && u.isChange)
    .map(u => ({ hash: u.hash, outputIndex: u.outputIndex }));

  const utxoStrategy: UtxoStrategy = {
    strategy: bitcoinPickingStrategy.RBF_SPEEDUP,
    excludeUTXOs,
  };

  const networkInfo = await getAccountNetworkInfo(account);
  const changeAddress = await walletAccount.xpub.getNewAddress(1, 1);
  const speed = networkInfo?.feeItems.items.find(item => "fast" === item.speed);

  const shouldUseFastStrategy = speed?.feePerByte ? feePerByte.isEqualTo(speed.feePerByte) : false;

  return {
    family: "bitcoin",
    recipient,
    amount: new BigNumber(amountSent),
    feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
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
  const walletAccount = getWalletAccount(account);

  const hexTx = await walletAccount.xpub.explorer.getTxHex(originalTxId);
  const originalTx = Transaction.fromHex(hexTx);

  if (!originalTx.ins.some(i => i.sequence < RBF_SEQUENCE_THRESHOLD)) {
    throw new Error("Transaction is not RBF-enabled");
  }

  // Minimum replacement feerate (to bump above original tx)
  const minFeeRateSatVb = await getMinReplacementFeeRateSatVb({
    account,
    originalTxId,
  });

  const feePerByte = minFeeRateSatVb.integerValue(BigNumber.ROUND_CEIL);

  // Fetch wallet UTXOs (used by the picking strategy)
  const changeAddrs = new Set(
    walletAccount.xpub.storage.getUniquesAddresses({ account: 1 }).map(a => a.address),
  );

  const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
  const walletUtxos = rawUtxos.map(u => fromWalletUtxo(u, changeAddrs));

  // TODO: for cancel, we should probably not exclude all change UTXOs?
  const excludeUTXOs = walletUtxos
    .filter(u => u.blockHeight === null && u.isChange)
    .map(u => ({ hash: u.hash, outputIndex: u.outputIndex }));

  const utxoStrategy: UtxoStrategy = {
    strategy: bitcoinPickingStrategy.RBF_SPEEDUP,
    excludeUTXOs,
  };

  const networkInfo = await getAccountNetworkInfo(account);

  const changeAddress = await walletAccount.xpub.getNewAddress(1, 1);
  const recipient = changeAddress.address;

  const fast = networkInfo?.feeItems.items.find(item => item.speed === "fast");
  const shouldUseFastStrategy = fast?.feePerByte ? feePerByte.isEqualTo(fast.feePerByte) : false;

  return {
    family: "bitcoin",
    recipient,
    useAllAmount: true,
    amount: new BigNumber(0),
    feesStrategy: shouldUseFastStrategy ? "fast" : "custom",
    utxoStrategy,
    rbf: true,
    replaceTxId: originalTxId,
    feePerByte,
    networkInfo,
    changeAddress: changeAddress.address,
  };
}

// TODO: remove this code
export async function checkTXID(account: Account, txid1: string, txid2: string): Promise<boolean> {
  const walletAccount = getWalletAccount(account);
  console.log("checkTXID", txid1, txid2);
  // 1️⃣ Fetch original transaction hex
  const hexTx1 = await walletAccount.xpub.explorer.getTxHex(txid1);
  const tx1 = Transaction.fromHex(hexTx1);
  console.log("checkTXID 1");

  const hexTx2 = await walletAccount.xpub.explorer.getTxHex(txid2);
  const tx2 = Transaction.fromHex(hexTx2);
  console.log("checkTXID 2");

  const tx1Inputs = tx1.ins.map(input => {
    const txid = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");
    const vout = input.index;
    return `${txid}:${vout}`;
  });
  console.log("TX1 Inputs:", tx1Inputs);

  const tx2Inputs = tx2.ins.map(input => {
    const txid = Buffer.from(Uint8Array.from(input.hash)).reverse().toString("hex");
    const vout = input.index;
    return `${txid}:${vout}`;
  });
  console.log("TX2 Inputs:", tx2Inputs);
  const sharedInputs = tx1Inputs.filter(i => tx2Inputs.includes(i));

  if (sharedInputs.length > 0) {
    console.log("Transactions share input(s):", sharedInputs);
    return true;
  } else {
    console.log("Transactions do NOT share any inputs");
    return false;
  }
}
