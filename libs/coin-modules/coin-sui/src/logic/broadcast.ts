import suiAPI from "../network";
// import { loadSui } from "./loadSui";

export async function broadcast(signature: string): Promise<string> {
  // await loadSui();
  return await suiAPI.submitExtrinsic(signature);
}
