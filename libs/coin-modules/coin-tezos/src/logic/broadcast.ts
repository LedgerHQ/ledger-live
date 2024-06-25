import { getTezosToolkit } from "../network/tezosToolkit";

export async function broadcast(signature: string): Promise<string> {
  const { rpc } = getTezosToolkit();
  return await rpc.injectOperation(signature);
}
