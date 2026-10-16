import type { Explorer } from "../network/explorer";
import { cryptoFor } from "./currency";
import { fetchOriginalTx } from "./replacement";
import type { BitcoinUtxoTransaction } from "./types";

/** A broadcast transaction, whatever address it touches, decoded from the network alone. */
export async function getTransaction(
  explorer: Explorer,
  currencyId: string,
  txid: string,
): Promise<Pick<BitcoinUtxoTransaction, "id" | "fees" | "inputs" | "outputs">> {
  const tx = await fetchOriginalTx(explorer, cryptoFor(currencyId), txid);
  return {
    id: tx.txid,
    fees: tx.fee.toString(),
    inputs: tx.inputs.map(input => ({
      txid: input.txid,
      vout: input.vout,
      ...(input.address === null ? {} : { address: input.address }),
      value: input.value.toString(),
      sequence: input.sequence,
    })),
    outputs: tx.outputs.map(output => ({
      index: output.index,
      ...(output.address === null ? {} : { address: output.address }),
      value: output.value.toString(),
    })),
  };
}
