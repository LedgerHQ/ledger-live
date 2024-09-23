import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge } from "@ledgerhq/types-live";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransactionToSign } from "./buildTransaction";
import type { ElrondAccount, Transaction } from "./types";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { extractTokenId } from "./logic";
import { CHAIN_ID } from "./constants";
import { ElrondSigner } from "./signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<ElrondSigner>,
  ): AccountBridge<Transaction, ElrondAccount>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      let cancelled = false;

      async function main() {
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        // Collect data for an ESDT transfer
        const { subAccounts } = account;
        const { subAccountId } = transaction;
        const tokenAccount = !subAccountId
          ? null
          : subAccounts && subAccounts.find(ta => ta.id === subAccountId);

        await signerContext(deviceId, signer => signer.setAddress(account.freshAddressPath));

        if (tokenAccount) {
          const { token } = decodeTokenAccountId(tokenAccount.id);
          if (token == null) {
            throw new Error("Invalid token");
          }

          await signerContext(deviceId, signer =>
            signer.provideESDTInfo(
              token.ticker,
              extractTokenId(token.id),
              token.units[0].magnitude,
              CHAIN_ID,
              token.ledgerSignature,
            ),
          );
        }

        const unsignedTx: string = await buildTransactionToSign(account, transaction);

        o.next({
          type: "device-signature-requested",
        });

        const { signature } = await signerContext(deviceId, signer =>
          signer.sign(account.freshAddressPath, unsignedTx),
        );

        if (cancelled) return;

        o.next({
          type: "device-signature-granted",
        });

        if (!signature) {
          throw new Error("No signature");
        }

        const parsedUnsignedTx = JSON.parse(unsignedTx);

        const operation = buildOptimisticOperation(account, transaction, parsedUnsignedTx);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signature.toString("hex"),
            rawData: parsedUnsignedTx,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );

      return () => {
        cancelled = true;
      };
    });

export default buildSignOperation;
