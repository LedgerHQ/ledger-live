import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import type { TezosAccount, TezosSigner, Transaction, TransactionStatus } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { craftTransaction, rawEncode } from "../logic";
import { getTezosToolkit } from "../logic/tezosToolkit";

// Exported for test purpose only
export async function getOperationContents({
  account,
  transaction,
  counter,
  public_key,
  public_key_hash,
}: {
  account: TezosAccount;
  transaction: Transaction;
  counter: number;
  public_key: string;
  public_key_hash: string;
}) {
  let publicKey = undefined;
  if (!account.tezosResources.revealed) {
    publicKey = {
      publicKey: public_key,
      publicKeyHash: public_key_hash,
    };
  }

  return craftTransaction(
    {
      address: account.freshAddress,
      counter,
    },
    {
      type: transaction.mode,
      recipient: transaction.recipient,
      amount: BigInt(transaction.amount.toString()),
      fee: {
        fees: (transaction.fees || 0).toString(),
        gasLimit: (transaction.gasLimit || 0).toString(),
        storageLimit: (transaction.storageLimit || 0).toString(),
      },
    },
    publicKey,
  );
}

export const buildSignOperation =
  (
    signerContext: SignerContext<TezosSigner>,
  ): AccountBridge<Transaction, TezosAccount, TransactionStatus>["signOperation"] =>
  ({ account, deviceId, transaction }): Observable<SignOperationEvent> =>
    new Observable(o => {
      let cancelled = false;

      async function main() {
        const { fees } = transaction;
        if (!fees) throw new FeeNotLoaded();

        const { freshAddressPath, freshAddress } = account;

        const signedInfo = await signerContext(deviceId, async signer => {
          const ledgerSigner = signer.createLedgerSigner(freshAddressPath, false, 0);

          const tezosToolkit = getTezosToolkit();
          tezosToolkit.setProvider({ signer: ledgerSigner });

          const publicKey = await ledgerSigner.publicKey();
          const publicKeyHash = await ledgerSigner.publicKeyHash();

          const sourceData = await tezosToolkit.rpc.getContract(freshAddress);

          o.next({ type: "device-signature-requested" });

          if (cancelled) {
            return;
          }

          const { type, contents } = await getOperationContents({
            account,
            transaction,
            counter: Number(sourceData.counter),
            public_key: publicKey,
            public_key_hash: publicKeyHash,
          });

          const forgedBytes = await rawEncode(contents);

          // 0x03 is a conventional prefix (aka a watermark) for tezos transactions
          const signature = await ledgerSigner.sign(
            Buffer.concat([Buffer.from("03", "hex"), Buffer.from(forgedBytes, "hex")]).toString(
              "hex",
            ),
          );

          return {
            type,
            signature,
          };
        });

        if (!signedInfo) {
          return;
        }

        o.next({ type: "device-signature-granted" });

        const { type, signature } = signedInfo;
        const operation = buildOptimisticOperation(account, transaction, type);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            // we slice the signature to remove the `03` prefix
            // which souldn't be included in the signature
            signature: signature.sbytes.slice(2),
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
