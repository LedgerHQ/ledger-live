import suiAPI from "../network";
// import { loadSui } from "./loadSui";

export async function broadcast(unsigned: string, serializedSignature: string): Promise<string> {
  const result = await suiAPI.executeTransactionBlock({
    transactionBlock: unsigned,
    signature: serializedSignature,
    options: {
      showEffects: true,
    },
  });
  // await loadSui();
  return result?.digest ?? "";
}
