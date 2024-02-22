import { Observable } from "rxjs";
import { LedgerSigner, DerivationType } from "@taquito/ledger-signer";
import { DEFAULT_FEE, OpKind, TezosToolkit } from "@taquito/taquito";
import { type OperationContents } from "@taquito/rpc";
import type { TezosAccount, TezosOperation, Transaction } from "./types";
import type { OperationType, SignOperationFnSignature } from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import { getEnv } from "@ledgerhq/live-env";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

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

  if (!(account as TezosAccount).tezosResources.revealed) {
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

export const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        let cancelled = false;

        async function main() {
          const { fees } = transaction;
          if (!fees) throw new FeeNotLoaded();

          const { freshAddressPath, freshAddress } = account;

          const tezos = new TezosToolkit(getEnv("API_TEZOS_NODE"));

          const ledgerSigner = new LedgerSigner(
            transport,
            freshAddressPath,
            false,
            DerivationType.ED25519,
          );

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
            account: account as TezosAccount,
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

          o.next({ type: "device-signature-granted" });

          // build optimistic operation
          const txHash = ""; // resolved at broadcast time
          const senders = [freshAddress];
          const recipients = [transaction.recipient];
          const accountId = account.id;

          // currently, all mode are always at least one OUT tx on ETH parent
          const operation: TezosOperation = {
            id: encodeOperationId(accountId, txHash, type),
            hash: txHash,
            type,
            value: transaction.amount,
            fee: fees,
            extra: {},
            blockHash: null,
            blockHeight: null,
            senders,
            recipients,
            accountId,
            date: new Date(),
          };

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
      }),
  );
