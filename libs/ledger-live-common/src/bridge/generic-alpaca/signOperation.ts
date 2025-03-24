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
        if (!transaction["fee"]) throw new FeeNotLoaded();
        o.next({ type: "device-signature-requested" });

        /*const { publicKey } = await signerContext(deviceId, signer =>
          signer.getAddress(account.freshAddressPath),
        );*/

        const unsigned = await getAlpacaApi(network, kind).craftTransaction(
          transactionToIntent(account, transaction),
        );

        const response = await signerContext(deviceId, signer =>
          signer.signTransaction(unsigned, account.freshAddressPath),
        );

        o.next({ type: "device-signature-granted" });

        const signed = getAlpacaApi(network, kind).combine(unsigned, response as string);

        const operation = buildOptimisticOperation(account, transaction);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: Buffer.from(signed).toString("base64"),
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
