import { BigNumber } from "bignumber.js";
import type {
  DecryptedOutput,
  DecryptedOutputRaw,
  ZcashPrivateInfo,
  ZcashPrivateInfoRaw,
  ZcashSyncState,
} from "./types";
import { rehydrateOutput } from "./serialization/rehydrate";

function mapDecryptedOutput(output: DecryptedOutput): DecryptedOutputRaw {
  return {
    memo: output.memo,
    transfer_type: output.transfer_type,
    amount: output.amount.toString(),
    ...(output.nullifier !== undefined && { nullifier: output.nullifier }),
    ...(output.rho !== undefined && { rho: output.rho }),
    ...(output.rseed !== undefined && { rseed: output.rseed }),
    ...(output.cmx !== undefined && { cmx: output.cmx }),
    ...(output.position !== undefined && { position: output.position }),
    ...(output.recipient !== undefined && { recipient: output.recipient }),
    ...(output.isSpent !== undefined && { is_spent: output.isSpent }),
  };
}

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
        orchard_outputs: (tx.decryptedData?.orchard_outputs ?? []).map(mapDecryptedOutput),
        sapling_outputs: (tx.decryptedData?.sapling_outputs ?? []).map(mapDecryptedOutput),
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
        orchard_outputs: (tx.decryptedData?.orchard_outputs ?? []).map(rehydrateOutput),
        sapling_outputs: (tx.decryptedData?.sapling_outputs ?? []).map(rehydrateOutput),
      },
    })),
  };
}
