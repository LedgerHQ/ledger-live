import { TezosToolkit } from "@taquito/taquito";
import { getEnv } from "@ledgerhq/live-env";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { SignedOperation } from "@ledgerhq/types-live";

const broadcast = async ({
  signedOperation: { operation, signature },
}: {
  signedOperation: SignedOperation;
}) => {
  const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));
  const { rpc } = tezos;
  const hash = await rpc.injectOperation(signature);

  return patchOperationWithHash(operation, hash);
};

export default broadcast;
