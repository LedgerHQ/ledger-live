import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  Account,
  DeviceId,
  SignOperationEvent,
  AccountBridge,
  TransactionCommon,
} from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { buildOptimisticOperation, transactionToIntent } from "./utils";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { Result } from "@ledgerhq/coin-framework/derivation";

/**
 * Sign Transaction with Ledger hardware
 */
export const genericSignOperation =
  (network, kind) =>
  (signerContext: SignerContext<any>): AccountBridge<TransactionCommon>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: TransactionCommon;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      const alpacaApi = getAlpacaApi(network, kind);
      if (alpacaApi.preSignOperationHook) {
        alpacaApi.preSignOperationHook({ transaction });
      }

      async function main() {
        if (!transaction["fees"]) throw new FeeNotLoaded();
        o.next({ type: "device-signature-requested" });

        const { publicKey } = (await signerContext(deviceId, signer =>
          signer.getAddress(account.freshAddressPath),
        )) as Result;

        console.log("IN SIGN OPERATION ALPACA: ", transaction);
        const transactionIntent = transactionToIntent(account, transaction);
        transactionIntent.sender = {
          ...transactionIntent.sender,
          publicKey,
        };
        if (transaction["tag"]) {
          transactionIntent.destinationTag = transaction["tag"];
        }
        const unsigned = await getAlpacaApi(network, kind).craftTransaction({
          ...transactionIntent,
        });
        console.log("unsigned", unsigned);
        const transactionSignature: string = await signerContext(deviceId, signer =>
          signer.signTransaction(account.freshAddressPath, unsigned),
        );
        console.log("transactionSignature", transactionSignature);
        o.next({ type: "device-signature-granted" });

        const signed = await getAlpacaApi(network, kind).combine(
          unsigned,
          transactionSignature,
          publicKey,
        );
        console.log("signed", signed);

        const operation = buildOptimisticOperation(account, transaction);
        // TODO: we set the transactionSequenceNumber before on the operation
        // now that we create it in craftTransaction, we might need to return it back from craftTransaction also
        console.log("operation", operation);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signed,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
