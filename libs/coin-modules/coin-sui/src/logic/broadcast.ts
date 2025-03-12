import suiAPI from "../network";

export async function broadcast(unsigned: string, serializedSignature: string): Promise<string> {
  const result = await suiAPI.executeTransactionBlock({
    transactionBlock: unsigned,
    signature: serializedSignature,
    options: {
      showEffects: true,
    },
  });
  return result?.digest ?? "";
}
