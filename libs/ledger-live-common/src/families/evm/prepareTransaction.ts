import BigNumber from "bignumber.js";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { getTransactionData, getTypedTransaction } from "./transaction";
import { validateRecipient } from "./getTransactionStatus";
import { Transaction as EvmTransaction } from "./types";
import { findSubAccountById } from "../../account";
import { getAdditionalLayer2Fees, getEstimatedFees } from "./logic";
import {
  getFeesEstimation,
  getGasEstimation,
  getTransactionCount,
} from "./api/rpc";

/**
 * Prepare basic coin transactions or smart contract interactions (other than live ERC20 transfers)
 * Should be used for transactions coming from the wallet API
 * Handling addition of gas limit
 */
export const prepareCoinTransaction = async (
  account: Account,
  typedTransaction: EvmTransaction
): Promise<EvmTransaction> => {
  // A `useAllAmount` transaction is a specific case of the live, and because we're in the
  // context of a coinTransaction, no smart contract should be involed
  if (typedTransaction.useAllAmount) {
    // Since a gas estimation is done by simulating the transaction, we can't know in advanced how much
    // we should put in the simulation.
    // But as a coin transaction (no smart contract) should always consumme the same amount of gas, no matter
    // the amount of coin transfered, we can infer the gasLimit with any amount.
    const gasLimit = await getGasEstimation(account, {
      ...typedTransaction,
      amount: new BigNumber(0),
    });
    const draftTransaction = {
      ...typedTransaction,
      gasLimit,
    };
    const estimatedFees = getEstimatedFees(draftTransaction);
    const additionalFees = await getAdditionalLayer2Fees(
      account.currency,
      draftTransaction
    );
    const amount = BigNumber.max(
      account.balance.minus(estimatedFees).minus(additionalFees || 0),
      0
    );

    return {
      ...draftTransaction,
      amount,
      additionalFees,
    };
  }

  const gasLimit = await getGasEstimation(account, typedTransaction).catch(
    // in case of a smart contract interaction, the gas estimation
    // (which is transaction simulation by the node) can fail.
    // E.g. A DApp is creating an invalid transaction, swaping more Tokens than the user actually have -> fail
    // This value of 0 should be catched by `getTransactionStatus`
    // and displayed in the UI as `set the gas manually`
    () => new BigNumber(0)
  );
  const additionalFees = await getAdditionalLayer2Fees(account.currency, {
    ...typedTransaction,
    gasLimit,
  });

  return {
    ...typedTransaction,
    gasLimit,
    additionalFees,
  };
};

/**
 * Prepare ERC20 transactions.
 * Handling addition of ERC20 transfer data and gas limit
 */
export const prepareTokenTransaction = async (
  account: Account,
  tokenAccount: TokenAccount,
  typedTransaction: EvmTransaction
): Promise<EvmTransaction> => {
  const [recipientErrors] = validateRecipient(account, typedTransaction);
  const amount = typedTransaction.useAllAmount
    ? tokenAccount.balance
    : typedTransaction.amount;
  const data = !Object.keys(recipientErrors).length
    ? getTransactionData({ ...typedTransaction, amount })
    : undefined;
  // As we're interacting with a smart contract,
  // it's going to be the real recipient for the tx
  const gasLimit = data
    ? await getGasEstimation(account, {
        ...typedTransaction,
        amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
        recipient: tokenAccount.token.contractAddress, // recipient is then the token smart contract
        data, // buffer containing the calldata bytecode
      }).catch(() => new BigNumber(0)) // this catch returning 0 should be handled by the `getTransactionStatus` method
    : new BigNumber(0);
  const additionalFees = await getAdditionalLayer2Fees(account.currency, {
    ...typedTransaction,
    amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
    recipient: tokenAccount.token.contractAddress, // recipient is then the token smart contract
    data, // buffer containing the calldata bytecode
    gasLimit,
  });

  // Recipient isn't changed here as it would change on the UI end as well
  // The change will be handled by the `prepareForSignOperation` method
  return {
    ...typedTransaction,
    amount,
    data,
    gasLimit,
    additionalFees,
  };
};

/**
 * Method called to update a transaction into a state that would make it valid
 * (E.g. Adding fees, add smart contract data, etc...)
 */
export const prepareTransaction = async (
  account: Account,
  transaction: EvmTransaction
): Promise<EvmTransaction> => {
  const { currency } = account;
  // Get the current network status fees
  const feeData = await getFeesEstimation(currency);
  const subAccount = findSubAccountById(
    account,
    transaction.subAccountId || ""
  );
  const isTokenTransaction = subAccount?.type === "TokenAccount";
  const typedTransaction = getTypedTransaction(transaction, feeData);

  return isTokenTransaction
    ? await prepareTokenTransaction(account, subAccount, typedTransaction)
    : await prepareCoinTransaction(account, typedTransaction);
};

/**
 * Prepare the transaction for the signOperation step.
 * For now, used to changed the recipient for TokenAccount transfers
 * with the smart contract address as recipient and add the nonce
 * (which would change as well in the UI if it was done before that step)
 */
export const prepareForSignOperation = async (
  account: Account,
  transaction: EvmTransaction
): Promise<EvmTransaction> => {
  const nonce = await getTransactionCount(
    account.currency,
    account.freshAddress
  );

  const subAccount = findSubAccountById(
    account,
    transaction.subAccountId || ""
  );
  const isTokenTransaction = subAccount?.type === "TokenAccount";

  return isTokenTransaction
    ? {
        ...transaction,
        amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
        recipient: subAccount.token.contractAddress, // recipient is then the token smart contract
        // data as already been added by the `prepareTokenTransaction` method
        nonce,
      }
    : {
        ...transaction,
        nonce,
      };
};
