import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, DeviceId, SignOperationEvent } from "@ledgerhq/types-live";
import { Address, beginCell, external, storeMessage, toNano } from "@ton/core";
import { WalletContractV4 } from "@ton/ton";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import { TOKEN_TRANSFER_MAX_FEE } from "./constants";
import type { TonSigner } from "./signer";
import type { TonAccount, TonCell, TonOperation, Transaction } from "./types";
import { buildTonTransaction, getLedgerTonPath } from "./utils";

const packTransaction = (account: Account, needsInit: boolean, signature: TonCell): string => {
  const { address } = Address.parseFriendly(account.freshAddress);
  let init: { code: TonCell; data: TonCell } | null = null;
  if (needsInit) {
    if (account.xpub?.length !== 64) throw Error("[ton] xpub can't be found");
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: Buffer.from(account.xpub, "hex"),
    });
    init = wallet.init;
  }
  const ext = external({ to: address, init, body: signature });
  return beginCell().store(storeMessage(ext)).endCell().toBoc().toString("base64");
};

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<TonSigner>,
  ): AccountBridge<Transaction, TonAccount>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: TonAccount;
    transaction: Transaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      let cancelled = false;
      async function main() {
        const address = account.freshAddress;
        const accountInfo = await fetchAccountInfo(address);

        const tonTx = buildTonTransaction(transaction, accountInfo.seqno, account);

        const ledgerPath = getLedgerTonPath(account.freshAddressPath);

        o.next({ type: "device-signature-requested" });
        const sig = await signerContext(deviceId, signer =>
          signer.signTransaction(ledgerPath, tonTx),
        );

        if (cancelled) return;

        o.next({ type: "device-signature-granted" });

        if (!sig) {
          throw new Error("No signature");
        }

        const signature = packTransaction(account, accountInfo.status === "uninit", sig);

        const operation = buildOptimisticOperation(account, transaction);

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

export const buildOptimisticOperation = (
  account: TonAccount,
  transaction: Transaction,
): TonOperation => {
  const { recipient, amount, fees, comment, useAllAmount, subAccountId } = transaction;
  const { id: accountId } = account;

  const subAccount = findSubAccountById(account, subAccountId ?? "");
  const tokenTransfer = Boolean(subAccount && isTokenAccount(subAccount));
  const value = tokenTransfer
    ? BigNumber(toNano(TOKEN_TRANSFER_MAX_FEE).toString())
    : amount.plus(fees);

  const op: TonOperation = {
    id: "",
    hash: "",
    type: "OUT",
    senders: [account.freshAddress],
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
      comment,
    },
  };
  if (tokenTransfer && subAccount) {
    op.subOperations = [
      {
        id: "",
        hash: "",
        type: "OUT",
        value: useAllAmount ? subAccount.balance : amount,
        fee: fees,
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [recipient],
        accountId: subAccount.id,
        date: new Date(),
        extra: {
          lt: "",
          explorerHash: "",
          comment,
        },
        contract: subAccount.token.contractAddress,
      },
    ];
  }

  return op;
};

export default buildSignOperation;
