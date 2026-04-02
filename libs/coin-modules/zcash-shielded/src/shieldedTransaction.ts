import type { DecryptedTransaction } from "@ledgerhq/zcash-decrypt";
import type { RawTransaction } from "./jsonRpcClient";
import type { ShieldedTransaction } from "./types";
import { BigNumber } from "bignumber.js";

export const toShieldedTransaction = (
  tx: RawTransaction,
  decryptedTx: DecryptedTransaction,
): ShieldedTransaction => ({
  id: tx.txid,
  hex: tx.hex,
  blockHash: tx.blockhash,
  blockHeight: tx.height,
  timestamp: tx.time,
  fee: new BigNumber(tx.orchard.valueBalanceZat),
  decryptedData: {
    orchard_outputs: decryptedTx.orchard_outputs.map(output => ({
      ...output,
      amount: new BigNumber(output.amount),
    })),
    sapling_outputs: decryptedTx.sapling_outputs.map(output => ({
      ...output,
      amount: new BigNumber(output.amount),
    })),
  },
});
