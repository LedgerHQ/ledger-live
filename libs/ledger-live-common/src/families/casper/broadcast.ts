import { DeployUtil } from "casper-js-sdk";
import { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "./types";
import { broadcastTx } from "./api";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  // log("debug", "[broadcast] start fn");

  const tx = DeployUtil.deployFromJson(JSON.parse(signature)).unwrap();

  // log("debug", `[broadcast] isDeployOk ${DeployUtil.validateDeploy(tx).ok}`);
  const resp = await broadcastTx(tx);
  const { deploy_hash } = resp;

  const result = patchOperationWithHash(operation, deploy_hash);

  // log("debug", "[broadcast] finish fn");

  return result;
};
