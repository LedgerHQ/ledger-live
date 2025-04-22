import {
  UnsignedTokenTransferOptions,
  makeUnsignedSTXTokenTransfer,
  makeUnsignedContractCall,
  uintCV,
  standardPrincipalCV,
  StacksMessageType,
  PostConditionType,
  FungibleConditionCode,
  createStandardPrincipal,
  createAssetInfo,
  createMessageSignature,
  PostCondition,
  UnsignedContractCallOptions,
  AnchorMode,
  StacksTransaction,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { TokenAccount } from "@ledgerhq/types-live";
import { StacksNetwork } from "../../network/api.types";
import { StacksOperation, Transaction } from "../../types";
import { memoToBufferCV } from "./memoUtils";

/**
 * Extracts token contract details from a TokenAccount
 * @param {TokenAccount} subAccount - The token subaccount containing token details
 * @returns {Object|null} Object containing contract address, name and asset name, or null if no subAccount
 */
export const getTokenContractDetails = (subAccount?: TokenAccount) => {
  if (!subAccount) return null;

  const contractAddress = subAccount.token.contractAddress;
  const contractName = subAccount.token.id.split(".").pop()?.split("::")[0] ?? "";
  const assetName = subAccount.token.id.split(".").pop()?.split("::")[1] ?? "";

  return { contractAddress, contractName, assetName };
};

/**
 * Creates function arguments for a SIP-010 token transfer
 * @param {BigNumber} amount - The amount of tokens to transfer
 * @param {string} senderAddress - The sender's address
 * @param {string} recipientAddress - The recipient's address
 * @param {string} [memo] - Optional memo to include with the transaction
 * @returns {Array} Array of Clarity values for the token transfer function
 */
export const createTokenTransferFunctionArgs = (
  amount: BigNumber,
  senderAddress: string,
  recipientAddress: string,
  memo?: string,
) => {
  return [
    uintCV(amount.toFixed()), // Amount
    standardPrincipalCV(senderAddress), // Sender
    standardPrincipalCV(recipientAddress), // Recipient
    memoToBufferCV(memo), // Memo (optional)
  ];
};

/**
 * Creates post conditions for a token transfer transaction
 * @param {string} senderAddress - The sender's address
 * @param {BigNumber} amount - The amount of tokens to transfer
 * @param {string} contractAddress - The token's contract address
 * @param {string} contractName - The token's contract name
 * @param {string} assetName - The token's asset name
 * @returns {PostCondition[]} Array of post conditions for the transaction
 */
export const createTokenTransferPostConditions = (
  senderAddress: string,
  amount: BigNumber,
  contractAddress: string,
  contractName: string,
  assetName: string,
): PostCondition[] => {
  return [
    {
      type: StacksMessageType.PostCondition,
      conditionType: PostConditionType.Fungible,
      principal: createStandardPrincipal(senderAddress),
      conditionCode: FungibleConditionCode.Equal,
      amount: BigInt(amount.toFixed()),
      assetInfo: createAssetInfo(contractAddress, contractName, assetName),
    } as PostCondition,
  ];
};

/**
 * Creates an unsigned token transfer transaction (SIP-010 tokens)
 * @param {string} contractAddress - The token's contract address
 * @param {string} contractName - The token's contract name
 * @param {string} assetName - The token's asset name
 * @param {BigNumber} amount - The amount of tokens to transfer
 * @param {string} senderAddress - The sender's address
 * @param {string} recipientAddress - The recipient's address
 * @param {AnchorMode} anchorMode - The anchor mode for the transaction
 * @param {string} network - The network for the transaction (mainnet/testnet)
 * @param {string} publicKey - The sender's public key
 * @param {BigNumber} [fee] - Optional transaction fee
 * @param {BigNumber} [nonce] - Optional transaction nonce
 * @param {string} [memo] - Optional memo to include with the transaction
 * @returns {Promise<StacksTransaction>} The unsigned transaction object
 */
export const createTokenTransferTransaction = async (
  contractAddress: string,
  contractName: string,
  assetName: string,
  amount: BigNumber,
  senderAddress: string,
  recipientAddress: string,
  anchorMode: AnchorMode,
  network: string,
  publicKey: string,
  fee?: BigNumber,
  nonce?: BigNumber,
  memo?: string,
): Promise<StacksTransaction> => {
  const functionArgs = createTokenTransferFunctionArgs(
    amount,
    senderAddress,
    recipientAddress,
    memo,
  );

  const postConditions = createTokenTransferPostConditions(
    senderAddress,
    amount,
    contractAddress,
    contractName,
    assetName,
  );

  const contractCallOptions: UnsignedContractCallOptions = {
    contractAddress,
    contractName,
    functionName: "transfer",
    functionArgs,
    anchorMode,
    network: StacksNetwork[network],
    publicKey,
    postConditions,
  };

  if (fee) {
    contractCallOptions.fee = fee.toFixed();
  }
  if (nonce) {
    contractCallOptions.nonce = nonce.toFixed();
  }

  const tx = await makeUnsignedContractCall(contractCallOptions);

  return tx;
};

/**
 * Creates an unsigned STX transfer transaction
 * @param {BigNumber} amount - The amount of STX to transfer
 * @param {string} recipientAddress - The recipient's address
 * @param {AnchorMode} anchorMode - The anchor mode for the transaction
 * @param {string} network - The network for the transaction (mainnet/testnet)
 * @param {string} publicKey - The sender's public key
 * @param {BigNumber} [fee] - Optional transaction fee
 * @param {BigNumber} [nonce] - Optional transaction nonce
 * @param {string} [memo] - Optional memo to include with the transaction
 * @returns {Promise<StacksTransaction>} The unsigned transaction object
 */
export const createStxTransferTransaction = async (
  amount: BigNumber,
  recipientAddress: string,
  anchorMode: AnchorMode,
  network: string,
  publicKey: string,
  fee?: BigNumber,
  nonce?: BigNumber,
  memo?: string,
): Promise<StacksTransaction> => {
  const options: UnsignedTokenTransferOptions = {
    amount: amount.toFixed(),
    recipient: recipientAddress,
    anchorMode,
    network: StacksNetwork[network],
    memo,
    publicKey,
  };

  if (fee) {
    options.fee = fee.toFixed();
  }
  if (nonce) {
    options.nonce = nonce.toFixed();
  }

  return makeUnsignedSTXTokenTransfer(options);
};

/**
 * Creates a transaction based on type (token or STX)
 * This function determines whether to create a token transfer or STX transfer
 * based on the subAccount parameter
 *
 * @param {Transaction} transaction - The transaction object with details
 * @param {string} senderAddress - The sender's address
 * @param {string} publicKey - The sender's public key
 * @param {TokenAccount} [subAccount] - The token subaccount (if this is a token transaction)
 * @param {BigNumber} [fee] - Optional transaction fee
 * @param {BigNumber} [nonce] - Optional transaction nonce
 * @returns {Promise<StacksTransaction>} The unsigned transaction object
 */
export const createTransaction = async (
  transaction: Transaction,
  senderAddress: string,
  publicKey: string,
  subAccount?: TokenAccount,
  fee?: BigNumber,
  nonce?: BigNumber,
): Promise<StacksTransaction> => {
  const { recipient, anchorMode, network, memo, amount } = transaction;

  const tokenDetails = getTokenContractDetails(subAccount);

  if (tokenDetails) {
    // Token transfer transaction
    const { contractAddress, contractName, assetName } = tokenDetails;
    return createTokenTransferTransaction(
      contractAddress,
      contractName,
      assetName,
      amount,
      senderAddress,
      recipient,
      anchorMode,
      network,
      publicKey,
      fee,
      nonce,
      memo,
    );
  } else {
    // Regular STX transfer
    return createStxTransferTransaction(
      amount,
      recipient,
      anchorMode,
      network,
      publicKey,
      fee,
      nonce,
      memo,
    );
  }
};

/**
 * Applies a signature to a transaction
 * This function adds the signature to the transaction and serializes it to a buffer
 *
 * @param {StacksTransaction} tx - The unsigned transaction object
 * @param {string} signature - The signature as a hex string
 * @returns {Buffer} The serialized signed transaction
 */
export const applySignatureToTransaction = (tx: StacksTransaction, signature: string): Buffer => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore need to ignore the TS error here
  tx.auth.spendingCondition.signature = createMessageSignature(signature);
  return Buffer.from(tx.serialize());
};

/**
 * Creates a transaction ready for broadcast from an operation and signature
 * This is used in the broadcast function to recreate and sign the transaction
 * with the appropriate signature
 *
 * @param {StacksOperation} operation - The operation containing transaction details
 * @param {string} signature - The signature as a hex string
 * @param {Record<string, any>} rawData - Additional data needed for transaction creation
 * @returns {Promise<Buffer>} The serialized signed transaction ready for broadcast
 */
export const getTxToBroadcast = async (
  operation: StacksOperation,
  signature: string,
  rawData: Record<string, unknown>,
): Promise<Buffer> => {
  const {
    value,
    recipients,
    senders,
    fee,
    extra: { memo },
  } = operation;

  const { anchorMode, network, xpub, contractAddress, contractName, assetName } = rawData as {
    anchorMode: AnchorMode;
    network: string;
    xpub: string;
    contractAddress?: string;
    contractName?: string;
    assetName?: string;
  };

  if (contractAddress && contractName && assetName) {
    // Create the function arguments for the SIP-010 transfer function
    const functionArgs = createTokenTransferFunctionArgs(
      new BigNumber(value),
      senders[0],
      recipients[0],
      memo !== undefined && memo !== null ? String(memo) : undefined,
    );

    const postConditions = createTokenTransferPostConditions(
      senders[0],
      new BigNumber(value),
      contractAddress,
      contractName,
      assetName,
    );

    const tx = await makeUnsignedContractCall({
      contractAddress,
      contractName,
      functionName: "transfer",
      functionArgs,
      anchorMode,
      network: StacksNetwork[network],
      publicKey: xpub,
      fee: fee.toFixed(),
      nonce: operation.transactionSequenceNumber ?? 0,
      postConditions,
    });

    return applySignatureToTransaction(tx, signature);
  } else {
    const tx = await createStxTransferTransaction(
      new BigNumber(value).minus(fee),
      recipients[0],
      anchorMode,
      network,
      xpub,
      new BigNumber(fee),
      new BigNumber(operation.transactionSequenceNumber ?? 0),
      memo !== undefined && memo !== null ? String(memo) : undefined,
    );

    return applySignatureToTransaction(tx, signature);
  }
};
