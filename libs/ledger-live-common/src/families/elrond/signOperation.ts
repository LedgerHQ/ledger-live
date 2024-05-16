import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { ElrondAccount, Transaction, TransactionStatus } from "./types";
import { withDevice } from "../../hw/deviceAccess";
import Elrond from "./hw-app-elrond";
import { buildTransactionToSign } from "./buildTransaction";
import { CHAIN_ID } from "./constants";
import { AccountBridge } from "@ledgerhq/types-live";
import { decodeTokenAccountId } from "../../account";
import { extractTokenId } from "./logic";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

/**
 * Sign Transaction with Ledger hardware
 */
export const signOperation: AccountBridge<
  Transaction,
  TransactionStatus,
  ElrondAccount
>["signOperation"] = ({ account, deviceId, transaction }) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
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

          const elrond = new Elrond(transport);
          await elrond.setAddress(account.freshAddressPath);

          if (tokenAccount) {
            const { token } = decodeTokenAccountId(tokenAccount.id);
            if (token == null) {
              throw new Error("Invalid token");
            }

            await elrond.provideESDTInfo(
              token.ticker,
              extractTokenId(token.id),
              token.units[0].magnitude,
              CHAIN_ID,
              token.ledgerSignature,
            );
          }

          const unsignedTx: string = await buildTransactionToSign(account, transaction);

          o.next({
            type: "device-signature-requested",
          });

          const r = await elrond.signTransaction(account.freshAddressPath, unsignedTx, true);

          o.next({
            type: "device-signature-granted",
          });

          const parsedUnsignedTx = JSON.parse(unsignedTx);

          const operation = buildOptimisticOperation(account, transaction, parsedUnsignedTx);

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: r,
              rawData: parsedUnsignedTx,
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

export default signOperation;
