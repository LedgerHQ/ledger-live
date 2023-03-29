import type { Transaction } from "./types";
import type { Account } from "@ledgerhq/types-live";
import { Units, utils } from "@crypto-org-chain/chain-jslib";
import { SIGN_MODE } from "@crypto-org-chain/chain-jslib/lib/dist/transaction/types";
import { getAccountParams } from "./api/sdk";
import { getCroSdk } from "./logic";

const getTransactionAmount = (a: Account, t: Transaction) => {
  const croSdk = getCroSdk(a.currency.id);

  switch (t.mode) {
    case "send":
      if (t.useAllAmount) {
        const balanceMinusFee = a.balance.minus(t.fees || 0);
        return new croSdk.Coin(balanceMinusFee.toString(), Units.BASE);
      } else {
        return new croSdk.Coin(t.amount.toString(), Units.BASE);
      }

    default:
      throw new Error("Unknown mode in transaction");
  }
};

/**
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const buildTransaction = async (
  a: Account,
  t: Transaction,
  publicKey: string
) => {
  const croSdk = getCroSdk(a.currency.id);
  const address = a.freshAddress;
  const { accountNumber, sequence } = await getAccountParams(
    address,
    a.currency.id
  );
  const rawTx = new croSdk.RawTransaction();
  rawTx.setFee(new croSdk.Coin((t.fees || 0).toString(), Units.BASE));

  const msgSend = new croSdk.bank.MsgSend({
    fromAddress: address,
    toAddress: t.recipient,
    amount: getTransactionAmount(a, t),
  });

  const { memo } = t;
  const memoTransaction = memo || "";
  rawTx.setMemo(memoTransaction);

  const signableTx = rawTx
    .appendMessage(msgSend)
    .addSigner({
      publicKey: utils.Bytes.fromHexString(publicKey),
      accountNumber: new utils.Big(accountNumber),
      accountSequence: new utils.Big(sequence),
      signMode: SIGN_MODE.LEGACY_AMINO_JSON,
    })
    .toSignable();
  return signableTx;
};
