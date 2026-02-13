import { rosettaSubmitTransaction } from "../../api";
import { MINA_TOKEN_ID } from "../../consts";
import { MinaSignedTransaction, TxType } from "../../types/common";

export const broadcastTransaction = async (txn: MinaSignedTransaction): Promise<string> => {
  const { nonce, receiverAddress, amount, fee, memo, senderAddress } = txn.transaction;
  const payment = {
    to: receiverAddress,
    from: senderAddress,
    fee: fee.toFixed(),
    token: MINA_TOKEN_ID,
    nonce: nonce.toFixed(),
    memo: memo ?? null,
    amount: amount.toFixed(),
    valid_until: null,
  };
  const delegation = {
    delegator: senderAddress,
    new_delegate: receiverAddress,
    fee: fee.toFixed(),
    nonce: nonce.toFixed(),
    memo: memo ?? null,
    valid_until: null,
  };
  const blob = {
    signature: txn.signature,
    payment: txn.transaction.txType === TxType.DELEGATION ? null : payment,
    stake_delegation: txn.transaction.txType === TxType.DELEGATION ? delegation : null,
  };

  const data = await rosettaSubmitTransaction(JSON.stringify(blob));

  return data.transaction_identifier.hash;
};
