import tezos from "../network/tezosToolkit";

export default async function broadcast(signature: string): Promise<string> {
  const { rpc } = tezos;
  return await rpc.injectOperation(signature);
};
