import { TezosToolkit } from "@taquito/taquito";
import { getEnv } from "@ledgerhq/live-env";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { AccountBridge, SignedOperation } from "@ledgerhq/types-live";
import { Transaction } from "../types";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, signature },
}: {
  signedOperation: SignedOperation;
}) => {
  const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));
  const { rpc } = tezos;
  const hash = await rpc.injectOperation(signature);

  return patchOperationWithHash(operation, hash);
};
