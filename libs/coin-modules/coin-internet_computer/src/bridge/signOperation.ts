import { Observable } from "rxjs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAddress } from "./bridgeHelpers/addresses";
import {
  getTxnExpirationDate,
  getTxnMetadata,
  getUnsignedTransaction,
  signICPTransaction,
} from "./bridgeHelpers/icpRosetta";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { Transaction } from "../types";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { ICPSigner } from "../types";
import { getPath } from "../common-logic";

export const buildSignOperation =
  (signerContext: SignerContext<ICPSigner>): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        const { xpub } = account;
        const { derivationPath } = getAddress(account);
        const { unsignedTxn, payloads } = await getUnsignedTransaction(transaction, account);

        o.next({
          type: "device-signature-requested",
        });

        const { signedTxn } = await signICPTransaction({
          signerContext,
          deviceId,
          unsignedTxn,
          path: getPath(derivationPath),
          payloads,
          pubkey: xpub ?? "",
        });

        o.next({
          type: "device-signature-granted",
        });

        const { hash } = await getTxnMetadata(signedTxn);
        const operation = await buildOptimisticOperation(account, transaction, hash);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signedTxn,
            expirationDate: getTxnExpirationDate(unsignedTxn),
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
