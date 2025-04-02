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
      async function main() {
        if (!transaction["fees"]) throw new FeeNotLoaded();
        o.next({ type: "device-signature-requested" });

        const { publicKey } = (await signerContext(deviceId, signer =>
          signer.getAddress(account.freshAddressPath),
        )) as Result;

        const unsigned = await getAlpacaApi(network, kind).craftTransaction({
          ...transactionToIntent(account, transaction),
          senderPublicKey: publicKey,
        });

        const transactionSignature: string = await signerContext(deviceId, signer =>
          signer.signTransaction(account.freshAddressPath, unsigned),
        );

        o.next({ type: "device-signature-granted" });

        const signed = await getAlpacaApi(network, kind).combine(
          unsigned,
          transactionSignature,
          publicKey,
        );

        const operation = buildOptimisticOperation(account, transaction);

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
