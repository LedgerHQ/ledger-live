import { ethers } from "ethers";
import { Observable } from "rxjs";
import Eth from "@ledgerhq/hw-app-eth";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { Account, SignOperationEvent } from "@ledgerhq/types-live";
import { transactionToUnsignedTransaction } from "./transaction";
import { transactionToEthersTransaction } from "./adapters";
import { Transaction as EvmTransaction } from "./types";
import { withDevice } from "../../hw/deviceAccess";

/**
 * Serialize a Ledger Live transaction into an hex string
 */
const getSerializedTransaction = async (
  account: Account,
  tx: EvmTransaction,
  signature?: Partial<ethers.Signature>
): Promise<string> => {
  const unsignedTransaction = await transactionToUnsignedTransaction(
    account,
    tx
  );
  const unsignedEthersTransaction = transactionToEthersTransaction(
    unsignedTransaction,
    account
  );

  return ethers.utils.serializeTransaction(
    unsignedEthersTransaction,
    signature as ethers.Signature
  );
};

/**
 * Sign Transaction with Ledger hardware
 */
export const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: string;
  transaction: EvmTransaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    (transport) =>
      new Observable((o) => {
        async function main() {
          o.next({
            type: "device-signature-requested",
          });

          const serializedTxHexString = await getSerializedTransaction(
            account,
            transaction
          ).then((str) => str.slice(2)); // Remove 0x prefix

          // Instanciate Eth app bindings
          const eth = new Eth(transport);
          // Request signature on the nano
          const sig = await eth.signTransaction(
            account.freshAddressPath,
            serializedTxHexString
          );

          o.next({ type: "device-signature-granted" }); // Signature is done

          const { chainId = 0 } = account.currency.ethereumLikeInfo || {};
          // Determine in which part of the elliptic curve we are (1 or 0)
          const parsedV = parseInt(sig.v, 16);
          const parity =
            parsedV > 1
              ? parsedV - 27 // if v isn't 1 or 0 then it should be 27 or 28
              : parsedV; // else use v as the parity directly
          // Respecting EIP155
          const v = chainId * 2 + 35 + parity;
          // Create a new serialized tx with the signature now
          const signature = await getSerializedTransaction(
            account,
            transaction,
            {
              r: "0x" + sig.r,
              s: "0x" + sig.s,
              v,
            }
          );

          const operation = buildOptimisticOperation(account, transaction);

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
              expirationDate: null,
            },
          });
        }

        main().then(
          () => o.complete(),
          (e) => o.error(e)
        );
      })
  );

export default signOperation;
