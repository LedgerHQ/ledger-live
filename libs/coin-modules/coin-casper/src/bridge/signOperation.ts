import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAddress } from "../bridge/bridgeHelpers/addresses";
import { createNewTransaction } from "../bridge/bridgeHelpers/txn";
import { Transaction } from "../types";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CasperSigner } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { KeyAlgorithm } from "casper-js-sdk";

export const buildSignOperation =
  (
    signerContext: SignerContext<CasperSigner>,
  ): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        // log("debug", "[signOperation] start fn");

        const { recipient, amount, fees, transferId } = transaction;
        const { address, derivationPath } = getAddress(account);
        const casperTx = await createNewTransaction(address, recipient, amount, fees, transferId);

        // Serialize tx
        const txBytes = casperTx.toBytes();
        log("debug", `[signOperation] serialized transaction: [${txBytes.toString()}]`);
        o.next({
          type: "device-signature-requested",
        });

        // Sign by device
        const { r } = await signerContext(deviceId, async signer => {
          const r = await signer.sign(derivationPath, Buffer.from(txBytes));
          return { r };
        });

        o.next({
          type: "device-signature-granted",
        });

        // signature verification
        const txHash = casperTx.hash.getHash()?.toHex() ?? "";
        const signature = Buffer.concat([Buffer.from([KeyAlgorithm.SECP256K1]), r.signatureRS]);

        const operation = buildOptimisticOperation(account, transaction, txHash);
        const txJson = casperTx.toJSON();

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: Buffer.from(signature).toString("hex"),
            rawData: {
              tx: JSON.stringify(txJson),
            },
          },
        });
      }
      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
