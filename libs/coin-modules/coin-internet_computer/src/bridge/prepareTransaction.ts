import { AccountBridge } from "@ledgerhq/types-live";
import {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import { getAddress } from "./bridgeHelpers/addresses";
import invariant from "invariant";
import { getSubAccountIdentifier, validateAddress } from "@zondax/ledger-live-icp/utils";
import { MAINNET_GOVERNANCE_CANISTER_ID } from "../consts";

export const prepareTransaction: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>["prepareTransaction"] = async (account, transaction) => {
  const { address } = getAddress(account);
  const { recipient } = transaction;

  let amount = transaction.amount;
  if (recipient && address) {
    const recipientValidation = await validateAddress(recipient);
    const addressValidation = await validateAddress(address);

    if (recipientValidation.isValid && addressValidation.isValid) {
      if (transaction.useAllAmount) {
        amount = account.spendableBalance.minus(transaction.fees);
        return { ...transaction, amount };
      }
    }
  }

  if (transaction.neuronAccountIdentifier && transaction.type === "increase_stake") {
    return { ...transaction, recipient: transaction.neuronAccountIdentifier };
  }

  if (transaction.type === "create_neuron" && transaction.recipient === "" && !transaction.memo) {
    invariant(account.xpub, "[ICP](prepareTransaction) Xpub not found");

    const { identifier, nonce } = await getSubAccountIdentifier(
      MAINNET_GOVERNANCE_CANISTER_ID,
      account.xpub,
    );

    return { ...transaction, recipient: identifier, memo: nonce.toString() };
  }

  return transaction;
};
