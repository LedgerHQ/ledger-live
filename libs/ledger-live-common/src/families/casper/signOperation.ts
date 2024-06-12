import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import { DeployUtil } from "casper-js-sdk";
import CasperApp from "@zondax/ledger-casper";
import { AccountBridge } from "@ledgerhq/types-live";
import { casperGetCLPublicKey, getAddress } from "./bridge/bridgeHelpers/addresses";
import { createNewDeploy } from "./bridge/bridgeHelpers/txn";
import { withDevice } from "../../hw/deviceAccess";
import { Transaction } from "./types";
import { getPath, isError } from "./msc-utils";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const casper = new CasperApp(transport);

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
          const result = await casper.sign(getPath(derivationPath), Buffer.from(deployBytes));
          isError(result);

          o.next({
            type: "device-signature-granted",
          });

          // signature verification
          const deployHash = deploy.hash.toString();
          const signature = result.signatureRS;

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
      }),
  );
