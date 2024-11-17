import { API_BASE } from "./config";
import { BigNumber } from "bignumber.js";

interface Outpoint {
  transactionId: string;
  index: number;
}

interface ScriptPublicKey {
  scriptPublicKey: string;
}

interface UtxoEntry {
  amount: BigNumber;
  scriptPublicKey: ScriptPublicKey;
  blockDaaScore: string;
  isCoinbase: boolean;
}

interface Utxo {
  address: string;
  outpoint: Outpoint;
  utxoEntry: UtxoEntry;
}

export const getUtxosForAddresses = async (addresses: string[]): Promise<Utxo[]> => {
  try {
    const response = await fetch(`${API_BASE}/addresses/utxos`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addresses }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch UTXOs for address ${addresses}. Status: ${response.status}`);
    }

    return (await response.json()) as Utxo[];
  } catch (error) {
    throw new Error(`Error fetching UTXOs: ${(error as Error).message}`);
  }
};
