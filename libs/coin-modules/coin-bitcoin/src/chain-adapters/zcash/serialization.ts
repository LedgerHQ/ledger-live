import { BigNumber } from "bignumber.js";
import type { ZcashPrivateInfo, ZcashPrivateInfoRaw, ZcashSyncState } from "./types";

export function toZcashPrivateInfoRaw(info: ZcashPrivateInfo): ZcashPrivateInfoRaw {
  return {
    saplingBalance: info.saplingBalance.toString(),
    orchardBalance: info.orchardBalance.toString(),
    lastSyncTimestamp: info.lastSyncTimestamp,
    ufvk: info.ufvk,
    syncState: info.syncState,
    progress: info.progress,
    estimatedTimeRemaining: info.estimatedTimeRemaining,
    birthday: info.birthday,
    lastProcessedBlock: info.lastProcessedBlock,
    transactions: info.transactions.map(tx => ({
      ...tx,
      fee: tx.fee.toString(),
      decryptedData: {
        orchard_outputs:
          tx.decryptedData?.orchard_outputs.map(output => ({
            ...output,
            amount: output.amount.toString(),
          })) || [],
        sapling_outputs:
          tx.decryptedData?.sapling_outputs.map(output => ({
            ...output,
            amount: output.amount.toString(),
          })) || [],
      },
    })),
  };
}

export function fromZcashPrivateInfoRaw(info: ZcashPrivateInfoRaw): ZcashPrivateInfo {
  return {
    saplingBalance: new BigNumber(info.saplingBalance),
    orchardBalance: new BigNumber(info.orchardBalance),
    lastSyncTimestamp: info.lastSyncTimestamp,
    ufvk: info.ufvk,
    syncState: info.syncState as ZcashSyncState,
    progress: info.progress,
    estimatedTimeRemaining: info.estimatedTimeRemaining,
    birthday: info.birthday,
    lastProcessedBlock: info.lastProcessedBlock,
    transactions: info.transactions.map(tx => ({
      ...tx,
      fee: new BigNumber(tx.fee),
      decryptedData: {
        orchard_outputs:
          tx.decryptedData?.orchard_outputs.map(output => ({
            ...output,
            amount: new BigNumber(output.amount),
          })) || [],
        sapling_outputs:
          tx.decryptedData?.sapling_outputs.map(output => ({
            ...output,
            amount: new BigNumber(output.amount),
          })) || [],
      },
    })),
  };
}
