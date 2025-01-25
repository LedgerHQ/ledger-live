import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import isEqual from "lodash/isEqual";
import { getNftCollectionMetadata } from "./api/nft";
import { getNodeApi } from "./api/node/index";
import { DEFAULT_NONCE } from "./createTransaction";
import { validateRecipient } from "./getTransactionStatus";
import { getAdditionalLayer2Fees, getEstimatedFees, isNftTransaction } from "./logic";
import { getTransactionData, getTypedTransaction } from "./transaction";
import { EvmNftTransaction, Transaction as EvmTransaction, FeeData, Strategy } from "./types";

/**
 * Prepare basic coin transactions or smart contract interactions (other than live ERC20 transfers)
 * Should be used for transactions coming from the wallet API
 * Handling addition of gas limit
 */
const prepareCoinTransaction = async (
  account: Account,
  typedTransaction: EvmTransaction,
): Promise<EvmTransaction> => {
  const nodeApi = getNodeApi(account.currency);
  // A `useAllAmount` transaction is a specific case of the live, and because we're in the
  // context of a coinTransaction, no smart contract should be involed
  if (typedTransaction.useAllAmount) {
    // Since a gas estimation is done by simulating the transaction, we can't know in advanced how much
    // we should put in the simulation.
    // But as a coin transaction (no smart contract) should always consumme the same amount of gas, no matter
    // the amount of coin transfered, we can infer the gasLimit with any amount.
    const gasLimit = await nodeApi
      .getGasEstimation(account, {
        ...typedTransaction,
        amount: new BigNumber(0),
      })
      .catch(() => new BigNumber(0)); // this catch returning 0 should be handled by the `getTransactionStatus` method
    const draftTransaction = {
      ...typedTransaction,
      gasLimit,
    };
    const estimatedFees = getEstimatedFees(draftTransaction);
    const additionalLayer2Fees = await getAdditionalLayer2Fees(account.currency, draftTransaction);
    // Original transaction `additionalFees` is kept as a way to make
    // any off-chain coin amount to be considered untransferable
    const additionalFees = additionalLayer2Fees
      ? additionalLayer2Fees.plus(draftTransaction.additionalFees || 0)
      : draftTransaction.additionalFees;
    const amount = BigNumber.max(
      account.balance.minus(estimatedFees).minus(additionalFees || 0),
      0,
    );

    return {
      ...draftTransaction,
      amount,
      additionalFees,
    };
  }

  const gasLimit = await nodeApi.getGasEstimation(account, typedTransaction).catch(
    // in case of a smart contract interaction, the gas estimation
    // (which is transaction simulation by the node) can fail.
    // E.g. A DApp is creating an invalid transaction, swaping more Tokens than the user actually have -> fail
    // This value of 0 should be catched by `getTransactionStatus`
    // and displayed in the UI as `set the gas manually`
    () => new BigNumber(0),
  );
  const additionalLayer2Fees = await getAdditionalLayer2Fees(account.currency, {
    ...typedTransaction,
    gasLimit,
  });
  // Original transaction `additionalFees` is kept as a way to make
  // any off-chain coin amount to be considered untransferable
  const additionalFees = additionalLayer2Fees
    ? additionalLayer2Fees.plus(typedTransaction.additionalFees || 0)
    : typedTransaction.additionalFees;

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
const prepareTokenTransaction = async (
  account: Account,
  tokenAccount: TokenAccount,
  typedTransaction: EvmTransaction,
): Promise<EvmTransaction> => {
  const nodeApi = getNodeApi(account.currency);
  const [recipientErrors] = validateRecipient(account, typedTransaction);
  const amount = typedTransaction.useAllAmount ? tokenAccount.balance : typedTransaction.amount;

  const data = !Object.keys(recipientErrors).length
    ? getTransactionData(account, { ...typedTransaction, amount })
    : undefined;
  // As we're interacting with a smart contract,
  // it's going to be the real recipient for the tx
  const gasLimit = data
    ? await nodeApi
        .getGasEstimation(account, {
          ...typedTransaction,
          amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
          recipient: tokenAccount.token.contractAddress, // recipient is then the token smart contract
          data, // buffer containing the calldata bytecode
        })
        .catch(() => new BigNumber(0)) // this catch returning 0 should be handled by the `getTransactionStatus` method
    : new BigNumber(0);
  const additionalLayer2Fees = await getAdditionalLayer2Fees(account.currency, {
    ...typedTransaction,
    amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
    recipient: tokenAccount.token.contractAddress, // recipient is then the token smart contract
    data, // buffer containing the calldata bytecode
    gasLimit,
  });
  // Original transaction `additionalFees` is kept as a way to make
  // any off-chain coin amount to be considered untransferable
  const additionalFees = additionalLayer2Fees
    ? additionalLayer2Fees.plus(typedTransaction.additionalFees || 0)
    : typedTransaction.additionalFees;

  // Recipient isn't changed here as it would change on the UI end as well
  // The change will be handled by the `prepareForSignOperation` method
  // right before the device signature by the signOperation step
  return {
    ...typedTransaction,
    amount,
    data,
    gasLimit,
    additionalFees,
  };
};

/**
 * Prepare ERC721/ERC1155 transactions.
 * Handling addition of NFT safeTransferFrom data and gas limit
 */
const prepareNftTransaction = async (
  account: Account,
  typedTransaction: EvmNftTransaction & EvmTransaction,
): Promise<EvmTransaction> => {
  const { currency } = account;
  const nodeApi = getNodeApi(currency);
  const [recipientErrors] = validateRecipient(account, typedTransaction);

  const data = !Object.keys(recipientErrors).length
    ? getTransactionData(account, typedTransaction)
    : undefined;
  // As we're interacting with a smart contract,
  // it's going to be the real recipient for the tx
  const gasLimit = data
    ? await nodeApi
        .getGasEstimation(account, {
          ...typedTransaction,
          amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
          recipient: typedTransaction.nft.contract, // recipient is then the nft smart contract
          data, // buffer containing the calldata bytecode
        })
        .catch(() => new BigNumber(0)) // this catch returning 0 should be handled by the `getTransactionStatus` method
    : new BigNumber(0);
  const additionalLayer2Fees = await getAdditionalLayer2Fees(account.currency, {
    ...typedTransaction,
    amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
    recipient: typedTransaction.nft.contract, // recipient is then the token smart contract
    data, // buffer containing the calldata bytecode
    gasLimit,
  });
  // Original transaction `additionalFees` is kept as a way to make
  // any off-chain coin amount to be considered untransferable
  const additionalFees = additionalLayer2Fees
    ? additionalLayer2Fees.plus(typedTransaction.additionalFees || 0)
    : typedTransaction.additionalFees;

  // Providing the collection name to the transaction for the
  // deviceTransactionConfig step (so purely UI)
  const [collectionMetadata] = await getNftCollectionMetadata(
    [{ contract: typedTransaction.nft.contract }],
    { chainId: currency?.ethereumLikeInfo?.chainId || 0 },
  );
  const nft = {
    ...typedTransaction.nft,
    collectionName: collectionMetadata.result?.tokenName || "",
  };

  // Recipient isn't changed here as it would change on the UI end as well
  // The change will be handled by the `prepareForSignOperation` method
  // right before the device signature by the signOperation step
  return {
    ...typedTransaction,
    data,
    gasLimit,
    additionalFees,
    nft,
  };
};

/**
 * Method called to update a transaction into a state that would make it valid
 * (E.g. Adding fees, add smart contract data, etc...)
 */
export const prepareTransaction = async (
  account: Account,
  transaction: EvmTransaction,
): Promise<EvmTransaction> => {
  const { currency } = account;
  const nodeApi = getNodeApi(currency);
  // Get the current network status fees
  const feeData: FeeData = await (async (): Promise<FeeData> => {
    if (transaction.feesStrategy === "custom") {
      const gasOption = await nodeApi.getFeeData(currency, transaction);

      return {
        gasPrice: gasOption.gasPrice && transaction.gasPrice ? transaction.gasPrice : null,
        maxFeePerGas:
          gasOption.maxFeePerGas && transaction.maxFeePerGas ? transaction.maxFeePerGas : null,
        maxPriorityFeePerGas:
          gasOption.maxPriorityFeePerGas && transaction.maxPriorityFeePerGas
            ? transaction.maxPriorityFeePerGas
            : null,
        nextBaseFee: transaction.gasOptions?.medium?.nextBaseFee ?? null,
      };
    }

    const gasOption = transaction.gasOptions?.[transaction.feesStrategy as Strategy];
    return gasOption || nodeApi.getFeeData(currency, transaction);
  })();

  const subAccount = findSubAccountById(account, transaction.subAccountId || "");
  const typedTransaction = getTypedTransaction(transaction, feeData);

  const newTransaction = await ((): Promise<EvmTransaction> => {
    if (isNftTransaction(typedTransaction)) {
      return prepareNftTransaction(account, typedTransaction);
    }
    const isTokenTransaction = subAccount?.type === "TokenAccount";
    return isTokenTransaction
      ? prepareTokenTransaction(account, subAccount, typedTransaction)
      : prepareCoinTransaction(account, typedTransaction);
  })();

  // maintaining reference if the transaction hasn't change
  return isEqual(transaction, newTransaction) ? transaction : newTransaction;
};

/**
 * Prepare the transaction for the signOperation step.
 * For now, used to changed the recipient for TokenAccount transfers
 * with the smart contract address as recipient and add the nonce
 * (which would change as well in the UI if it was done before that step)
 */
export const prepareForSignOperation = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: EvmTransaction;
  isValidNonce?: boolean;
}): Promise<EvmTransaction> => {
  const nodeApi = getNodeApi(account.currency);

  const isValidNonce = transaction.nonce !== DEFAULT_NONCE;

  const nonce = isValidNonce
    ? transaction.nonce
    : await nodeApi.getTransactionCount(account.currency, account.freshAddress);

  if (isNftTransaction(transaction)) {
    return {
      ...transaction,
      amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
      recipient: transaction.nft.contract, // recipient is then the NFT smart contract
      // data as already been added by the `prepareTokenTransaction` method
      nonce,
    };
  }

  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const isTokenTransaction = subAccount?.type === "TokenAccount";
  if (isTokenTransaction) {
    return {
      ...transaction,
      amount: new BigNumber(0), // amount set to 0 as we're interacting with a smart contract
      recipient: subAccount.token.contractAddress, // recipient is then the token smart contract
      // data as already been added by the `prepareTokenTransaction` method
      nonce,
    };
  }

  return {
    ...transaction,
    nonce,
  };
};
