import {
  UnsignedTokenTransferOptions,
  makeUnsignedSTXTokenTransfer,
  makeUnsignedContractCall,
  uintCV,
  standardPrincipalCV,
  someCV,
  stringAsciiCV,
  noneCV,
  StacksMessageType,
  PostConditionType,
  FungibleConditionCode,
  createStandardPrincipal,
  createAssetInfo,
  createMessageSignature,
  PostCondition,
  UnsignedContractCallOptions,
} from "@stacks/transactions";
import BigNumber from "bignumber.js";
import { TokenAccount } from "@ledgerhq/types-live";
import { StacksNetwork } from "../../network/api.types";
import { StacksOperation, Transaction } from "../../types";

/**
 * Extracts the token contract details from a subAccount
 */
export const getTokenContractDetails = (subAccount?: TokenAccount) => {
  if (!subAccount) return null;

  const contractAddress = subAccount.token.contractAddress;
  const contractName = subAccount.token.id.split(".").pop()?.split("::")[0] ?? "";
  const assetName = subAccount.token.id.split(".").pop()?.split("::")[1] ?? "";

  return { contractAddress, contractName, assetName };
};

/**
 * Creates the function arguments for a SIP-010 token transfer
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
    memo ? someCV(stringAsciiCV(memo)) : noneCV(), // Memo (optional)
  ];
};

/**
 * Creates post conditions for a token transfer
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
 * Creates an unsigned token transfer transaction
 */
export const createTokenTransferTransaction = async (
  contractAddress: string,
  contractName: string,
  assetName: string,
  amount: BigNumber,
  senderAddress: string,
  recipientAddress: string,
  anchorMode: any,
  network: any,
  publicKey: string,
  fee?: BigNumber,
  nonce?: BigNumber,
  memo?: string,
) => {
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
 */
export const createStxTransferTransaction = async (
  amount: BigNumber,
  recipientAddress: string,
  anchorMode: any,
  network: any,
  publicKey: string,
  fee?: BigNumber,
  nonce?: BigNumber,
  memo?: string,
) => {
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
 * Creates a transaction based on transaction type (token or STX)
 */
export const createTransaction = async (
  transaction: Transaction,
  senderAddress: string,
  publicKey: string,
  subAccount?: TokenAccount,
  fee?: BigNumber,
  nonce?: BigNumber,
) => {
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
 */
export const applySignatureToTransaction = (tx: any, signature: string): Buffer => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore need to ignore the TS error here
  tx.auth.spendingCondition.signature = createMessageSignature(signature);
  return Buffer.from(tx.serialize());
};

/**
 * Creates a transaction ready for broadcast from an operation and signature
 */
export const getTxToBroadcast = async (
  operation: StacksOperation,
  signature: string,
  rawData: Record<string, any>,
): Promise<Buffer> => {
  const {
    value,
    recipients,
    senders,
    fee,
    extra: { memo },
  } = operation;

  const { anchorMode, network, xpub, contractAddress, contractName, assetName } = rawData;

  if (contractAddress && contractName && assetName) {
    // Create the function arguments for the SIP-010 transfer function
    const functionArgs = createTokenTransferFunctionArgs(
      new BigNumber(value),
      senders[0],
      recipients[0],
      memo,
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
      memo,
    );

    return applySignatureToTransaction(tx, signature);
  }
};
