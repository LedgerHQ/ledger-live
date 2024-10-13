import { API_BASE } from "./config";

interface Outpoint {
  transactionId: string;
  index: number;
}

interface ScriptPublicKey {
  scriptPublicKey: string;
}

interface UtxoEntry {
  amount: string;
  scriptPublicKey: ScriptPublicKey;
  blockDaaScore: string;
  isCoinbase: boolean;
}

interface Utxo {
  address: string;
  outpoint: Outpoint;
  utxoEntry: UtxoEntry;
}

export const getUtxosForAddress = async (address: string): Promise<Utxo[]> => {
  try {
    const response = await fetch(`${API_BASE}/addresses/${address}/utxos`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch UTXOs for address ${address}. Status: ${response.status}`);
    }

    return (await response.json()) as Utxo[];
  } catch (error) {
    throw new Error(`Error fetching UTXOs: ${(error as Error).message}`);
  }
};
