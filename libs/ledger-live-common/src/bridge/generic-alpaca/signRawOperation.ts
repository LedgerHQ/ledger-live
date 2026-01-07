import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { buildOptimisticOperation } from "./utils";
import { Result } from "@ledgerhq/coin-framework/derivation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";

/**
 * Sign Transaction with Ledger hardware
 */
export const genericSignRawOperation =
  (network, kind) =>
  (signerContext: SignerContext<any>): AccountBridge<GenericTransaction>["signRawOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: string;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        const alpacaApi = getAlpacaApi(account.currency.id, kind);
        const signedInfo = await signerContext(deviceId, async signer => {
          const derivationPath = account.freshAddressPath;
          const { publicKey } = (await signer.getAddress(derivationPath)) as Result;

          const sender = account.freshAddress;

          // TODO: should compute it and pass it down to craftTransaction (duplicate call right now)
          const sequenceNumber = await alpacaApi.getSequence(sender);

          /* Craft unsigned blob via Alpaca */
          const { transaction: unsigned } = await alpacaApi.craftRawTransaction(
            transaction,
            sender,
            publicKey,
            sequenceNumber,
          );

          /* Notify UI that the device is now showing the tx */
          o.next({ type: "device-signature-requested" });
          /* Sign on Ledger device */
          const txnSig = await signer.signTransaction(derivationPath, unsigned);
          return { unsigned, txnSig, publicKey, sequence: sequenceNumber };
        });

        /* If the user cancelled inside signerContext */
        if (!signedInfo) return;
        o.next({ type: "device-signature-granted" });

        /* Combine payload + signature for broadcast */
        const combined = await alpacaApi.combine(
          signedInfo.unsigned,
          signedInfo.txnSig,
          signedInfo.publicKey,
        );
        const operation = buildOptimisticOperation(
          account,
          { family: account.currency.family, amount: new BigNumber(0), recipient: "" },
          signedInfo.sequence,
        );
        if (!operation.id) {
          log("Generic alpaca", "buildOptimisticOperation", operation);
        }
        // NOTE: we set the transactionSequenceNumber before on the operation
        // now that we create it in craftTransaction, we might need to return it back from craftTransaction also
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: combined,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
