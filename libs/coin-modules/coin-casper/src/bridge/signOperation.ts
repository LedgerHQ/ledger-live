import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import { DeployUtil } from "casper-js-sdk";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { casperGetCLPublicKey, getAddress } from "../bridge/bridgeHelpers/addresses";
import { createNewDeploy } from "../bridge/bridgeHelpers/txn";
import { Transaction } from "../types";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CasperSigner } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

export const buildSignOperation =
  (
    signerContext: SignerContext<CasperSigner>,
  ): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        // log("debug", "[signOperation] start fn");

        const { recipient } = transaction;
        const { address, derivationPath } = getAddress(account);
        const deploy = createNewDeploy(
          address,
          recipient,
          transaction.amount,
          transaction.fees,
          transaction.transferId,
        );

        // Serialize tx
        const deployBytes = DeployUtil.deployToBytes(deploy);
        log("debug", `[signOperation] serialized deploy: [${deployBytes.toString()}]`);
        o.next({
          type: "device-signature-requested",
        });

        // Sign by device
        const { r } = await signerContext(deviceId, async signer => {
          const r = await signer.sign(derivationPath, Buffer.from(deployBytes));
          return { r };
        });

        o.next({
          type: "device-signature-granted",
        });

        // signature verification
        const deployHash = deploy.hash.toString();
        const signature = r.signatureRS;

        // sign deploy object
        const signedDeploy = DeployUtil.setSignature(
          deploy,
          signature,
          casperGetCLPublicKey(address),
        );

        const operation = buildOptimisticOperation(account, transaction, deployHash);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: JSON.stringify(DeployUtil.deployToJson(signedDeploy)),
          },
        });
      }
      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
