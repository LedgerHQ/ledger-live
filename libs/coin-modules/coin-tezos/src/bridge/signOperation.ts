import { Observable } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { type OperationContents } from "@taquito/rpc";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { DEFAULT_FEE, OpKind, TezosToolkit } from "@taquito/taquito";
import type { OperationType, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import type { TezosAccount, TezosSigner, Transaction, TransactionStatus } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";

export async function getOperationContents({
  account,
  transaction,
  tezos,
  counter,
  public_key,
  public_key_hash,
}: {
  account: TezosAccount;
  transaction: Transaction;
  tezos: TezosToolkit;
  counter: number;
  public_key: string;
  public_key_hash: string;
}) {
  let type: OperationType = "NONE";
  const { freshAddress } = account;

  const transactionFees = {
    fee: (transaction.fees || 0).toString(),
    gas_limit: (transaction.gasLimit || 0).toString(),
    storage_limit: (transaction.storageLimit || 0).toString(),
  };

  const contents: OperationContents[] = [];

  if (!account.tezosResources.revealed) {
    const revealFees = await tezos.estimate.reveal();

    contents.push({
      kind: OpKind.REVEAL,
      fee: DEFAULT_FEE.REVEAL.toString(),
      gas_limit: (revealFees?.gasLimit || 0).toString(),
      storage_limit: (revealFees?.storageLimit || 0).toString(),
      source: public_key_hash,
      counter: (counter + 1).toString(),
      public_key,
    });
  }

  switch (transaction.mode) {
    case "send": {
      type = "OUT";

      contents.push({
        kind: OpKind.TRANSACTION,
        amount: transaction.amount.toString(),
        destination: transaction.recipient,
        source: freshAddress,
        counter: (counter + 1 + contents.length).toString(),
        ...transactionFees,
      });

      break;
    }
    case "delegate": {
      type = "DELEGATE";

      contents.push({
        kind: OpKind.DELEGATION,
        source: freshAddress,
        counter: (counter + 1 + contents.length).toString(),
        delegate: transaction.recipient,
        ...transactionFees,
      });

      break;
    }
    case "undelegate": {
      type = "UNDELEGATE";

      // we undelegate as there's no "delegate" field
      // OpKind is still "DELEGATION"
      contents.push({
        kind: OpKind.DELEGATION,
        source: freshAddress,
        counter: (counter + 1 + contents.length).toString(),
        ...transactionFees,
      });

      break;
    }
    default:
      throw new Error("not supported");
  }

  return { type, contents };
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

        const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));

        const signedInfo = await signerContext(deviceId, async signer => {
          const ledgerSigner = signer.createLedgerSigner(freshAddressPath, false, 0);

          tezos.setProvider({ signer: ledgerSigner });

          const publicKey = await ledgerSigner.publicKey();
          const publicKeyHash = await ledgerSigner.publicKeyHash();

          const { rpc } = tezos;
          const block = await rpc.getBlock();
          const sourceData = await rpc.getContract(freshAddress);

          o.next({ type: "device-signature-requested" });

          if (cancelled) {
            return;
          }

          const { type, contents } = await getOperationContents({
            account,
            transaction,
            tezos,
            counter: Number(sourceData.counter),
            public_key: publicKey,
            public_key_hash: publicKeyHash,
          });

          const forgedBytes = await rpc.forgeOperations({
            branch: block.hash,
            contents,
          });

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
