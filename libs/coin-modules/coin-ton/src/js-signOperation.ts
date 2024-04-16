import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  Account,
  DeviceId,
  SignOperationEvent,
  SignOperationFnSignature,
} from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { TonAddress, TonSignature, TonSigner } from "./signer";
import type { TonOperation, Transaction } from "./types";
import {
  getAddress,
  getLedgerTonPath,
  getSubAccount,
  packTransaction,
  transactionToHwParams,
} from "./utils";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<TonSigner, TonAddress | TonSignature>,
  ): SignOperationFnSignature<Transaction> =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: Transaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      let cancelled = false;
      async function main() {
        const { address, derivationPath } = getAddress(account);
        const accountInfo = await fetchAccountInfo(address);

        const subAccount = getSubAccount(transaction, account);
        const tokenTransfer = Boolean(subAccount && subAccount.type === "TokenAccount");

        const tonTx = transactionToHwParams(
          transaction,
          accountInfo.seqno,
          tokenTransfer && subAccount ? subAccount : undefined,
        );
        const ledgerPath = getLedgerTonPath(derivationPath);

        o.next({ type: "device-signature-requested" });
        const sig = (await signerContext(deviceId, signer =>
          signer.signTransaction(ledgerPath, tonTx),
        )) as TonSignature;

        if (cancelled) return;

        o.next({ type: "device-signature-granted" });

        if (!sig) {
          throw new Error("No signature");
        }

        const signature = packTransaction(account, accountInfo.status === "uninit", sig);
        const hash = sig.hash().toString("hex");

        const operation = buildOptimisticOperation(account, transaction, address, hash);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
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

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  address: string,
  hash: string,
): TonOperation => {
  const { recipient, amount, fees, comment, useAllAmount } = transaction;
  const { id: accountId } = account;

  const subAccount = getSubAccount(transaction, account);
  const tokenTransfer = subAccount?.type === "TokenAccount";

  const value = tokenTransfer ? fees : amount.plus(fees);

  const op: TonOperation = {
    id: hash,
    hash,
    type: "OUT",
    senders: [address],
    recipients: [recipient],
    accountId,
    value,
    fee: fees,
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {
      // we don't know yet, will be patched in final operation
      lt: "",
      explorerHash: "",
      comment: comment,
    },
  };

  if (tokenTransfer && subAccount) {
    op.subOperations = [
      {
        id: encodeOperationId(subAccount.id, hash, "OUT"),
        hash,
        type: "OUT",
        value: useAllAmount ? subAccount.balance : transaction.amount,
        fee: fees,
        blockHash: null,
        blockHeight: null,
        senders: [address],
        recipients: [recipient],
        accountId: subAccount.id,
        date: new Date(),
        extra: {
          lt: "",
          explorerHash: "",
          comment: comment,
        },
        contract: subAccount.token.contractAddress,
      },
    ];
  }
  return op;
};

export default buildSignOperation;
