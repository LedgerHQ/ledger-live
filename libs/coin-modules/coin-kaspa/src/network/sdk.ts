const API_BASE = "https://api.kaspa.org";

interface BalanceResponse {
  address: string;
  balance: number;
}

export const getBalanceForAddress = async (address: string[]): Promise<BalanceResponse> => {
  const balance = fetch(API_BASE + `/addresses/${address}/balance`)
    .then(res => res.json().then(data => data as BalanceResponse))
    .catch(err => {
      throw Error(`Unable to fetch balance. ${err}`);
    });

  return balance;
};

export const submitTransaction = async (transaction: any) => {
  try {
    const response = await fetch(`${API_BASE}/transactions/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit transaction. Status: ${response.status}`);
    }

    const txId: string = await response.text();
    return txId;
  } catch (error) {
    throw new Error(`Error submitting transaction: ${error}`);
  }
};

interface FeeEstimate {
  priorityBucket: {
    feerate: number;
    estimatedSeconds: number;
  };
  normalBuckets: [
    {
      feerate: number;
      estimatedSeconds: number;
    },
    {
      feerate: number;
      estimatedSeconds: number;
    },
  ];
  lowBuckets: [
    {
      feerate: number;
      estimatedSeconds: number;
    },
  ];
}

export const getFees = async (): Promise<FeeEstimate> => {
  try {
    const response = await fetch(`${API_BASE}/info/fee-estimate`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch fee estimates. Status: ${response.status}`);
    }

    const feeEstimate: FeeEstimate = await response.json();
    return feeEstimate;
  } catch (error) {
    throw new Error(`Error fetching fee estimates: ${error}`);
  }
};
