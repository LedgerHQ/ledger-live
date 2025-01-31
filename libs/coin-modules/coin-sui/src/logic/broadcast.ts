import suiAPI from "../network";
// import { loadSui } from "./loadSui";

export async function broadcast(signature: string): Promise<string> {
  console.log("broadcast", signature);
  // await loadSui();
  return await suiAPI.submitExtrinsic(signature);
}
