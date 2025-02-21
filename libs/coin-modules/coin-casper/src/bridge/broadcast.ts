import { DeployUtil } from "casper-js-sdk";
import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "../types";
import { broadcastTx } from "../api";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  const tx = DeployUtil.deployFromJson(JSON.parse(signature)).unwrap();

  const resp = await broadcastTx(tx);
  const { deploy_hash } = resp;

  const result = patchOperationWithHash(operation, deploy_hash);

  return result;
};
