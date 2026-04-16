import BigNumber from "bignumber.js";

/**
 * Craft a Tempo transaction.
 * Since Tempo uses custom tx type 0x76, actual RLP encoding happens
 * on the device / in lama-ethereum. This returns a placeholder serialization.
 */
export async function craftTransaction(
  account: {
    address: string;
    nonce?: number;
    publicKey?: string;
  },
  transaction: {
    recipient?: string;
    amount: BigNumber;
    fee?: BigNumber;
  },
): Promise<{
  serializedTransaction: string;
}> {
  const txPayload = {
    type: "0x76",
    from: account.address,
    to: transaction.recipient || "",
    value: transaction.amount.toString(),
    nonce: account.nonce || 0,
    fee: transaction.fee?.toString() || "0",
  };

  return {
    serializedTransaction: JSON.stringify(txPayload),
  };
}
