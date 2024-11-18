import { API_BASE } from "./config";

type TxApiResponse = {
  subnetwork_id: string;
  transaction_id: string;
  hash: string;
  mass: string;
  block_hash: string[];
  block_time: number;
  is_accepted: boolean;
  accepting_block_hash: string;
  accepting_block_blue_score: number;
  inputs: Input[];
  outputs: Output[];
};

type Input = {
  transaction_id: string;
  index: number;
  previous_outpoint_hash: string;
  previous_outpoint_index: string;
  previous_outpoint_resolved: Output;
  previous_outpoint_address: string;
  previous_outpoint_amount: number;
  signature_script: string;
  sig_op_count: string;
};

type Output = {
  transaction_id: string;
  index: number;
  amount: number;
  script_public_key: string;
  script_public_key_address: string;
  script_public_key_type: string;
  accepting_block_hash: string;
};

export const getTransactions = async (address: string): Promise<TxApiResponse[]> => {
  try {
    const response = await fetch(
      `${API_BASE}/addresses/${address}/full-transactions-page?resolve_previous_outpoints=light&limit=50&before=0`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }

    const transactions: TxApiResponse[] = await response.json();
    return transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export default getTransactions;
