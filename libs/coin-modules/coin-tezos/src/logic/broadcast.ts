import { getTezosToolkit } from "./tezosToolkit";

export async function broadcast(signature: string): Promise<string> {
  const { rpc } = getTezosToolkit();
  return await rpc.injectOperation(signature);
}
