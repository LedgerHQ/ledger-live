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
import { StacksNetwork } from "../../network/api";
import { StacksOperation, Transaction } from "../../types";
import { memoToBufferCV } from "./memoUtils";

const specialConditionCode = new Set([
  "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.auto-alex-v3::auto-alex-v3",
  "SM26NBC8SFHNW4P1Y4DFH27974P56WN86C92HPEHH.token-lqstx::lqstx",
  "SP673Z4BPB4R73359K9HE55F2X91V5BJTN5SXZ5T.token-liabtc::liabtc",
]);

export type CreateTokenTransferTransactionOptions = {
  contractAddress: string;
  contractName: string;
  assetName: string;
  amount: BigNumber;
  senderAddress: string;
  recipientAddress: string;
  anchorMode: AnchorMode;
  network: string;
  publicKey: string;
  fee?: BigNumber;
  nonce?: BigNumber;
  memo?: string;
};

type BaseRawData = {
  anchorMode: AnchorMode;
  network: string;
  xpub: string;
};

type TokenTransferRawData = BaseRawData & {
  contractAddress: string;
  contractName: string;
  assetName: string;
};

// Type guard: validates rawData has all required token transfer fields
function isTokenTransferRawData(data: Record<string, unknown>): data is TokenTransferRawData {
  return (
    typeof data.contractAddress === "string" &&
    typeof data.contractName === "string" &&
    typeof data.assetName === "string" &&
    typeof data.anchorMode === "number" &&
    typeof data.network === "string" &&
    typeof data.xpub === "string"
  );
}

// Extracts and validates base fields from rawData (throws if invalid)
function extractBaseRawData(data: Record<string, unknown>): BaseRawData {
  const anchorMode = data.anchorMode;
  const network = data.network;
  const xpub = data.xpub;

  if (typeof anchorMode !== "number" || typeof network !== "string" || typeof xpub !== "string") {
    throw new Error("Invalid raw data: missing or invalid base fields");
  }

  return { anchorMode, network, xpub };
}

// Extracts contract address, name, and asset name from TokenAccount
// CARE: usage of asset name is case-sensitive
// Returns null if subAccount is undefined
export const getTokenContractDetails = (subAccount?: TokenAccount) => {
  if (!subAccount) return null;

  // Contract address format: "ADDRESS.CONTRACT-NAME::ASSET-NAME"
  const tokenId = subAccount.token.contractAddress;

  const contractAddress = tokenId.split(".").shift()?.toUpperCase() ?? "";
  const contractName = tokenId.split(".").pop()?.split("::")[0] ?? "";
  const assetName = tokenId.split(".").pop()?.split("::")[1] ?? "";

  return { contractAddress, contractName, assetName };
};

// Creates SIP-010 function arguments: [amount, sender, recipient, memo]
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

// Creates post conditions for token transfer
// Uses LessEqual for special tokens (auto-alex-v3, lqstx, liabtc), Equal for others
export const createTokenTransferPostConditions = (
  senderAddress: string,
  amount: BigNumber,
  contractAddress: string,
  contractName: string,
  assetName: string,
): PostCondition[] => {
  let conditionCode: FungibleConditionCode = FungibleConditionCode.Equal;
  if (specialConditionCode.has(`${contractAddress}.${contractName}::${assetName}`)) {
    conditionCode = FungibleConditionCode.LessEqual;
  }

  return [
    {
      type: StacksMessageType.PostCondition,
      conditionType: PostConditionType.Fungible,
      principal: createStandardPrincipal(senderAddress),
      conditionCode,
      amount: BigInt(amount.toFixed()),
      assetInfo: createAssetInfo(contractAddress, contractName, assetName),
    },
  ];
};

// Creates unsigned SIP-010 token transfer transaction
export const createTokenTransferTransaction = async (
  options: CreateTokenTransferTransactionOptions,
): Promise<StacksTransaction> => {
  const {
    contractAddress,
    contractName,
    assetName,
    amount,
    senderAddress,
    recipientAddress,
    anchorMode,
    network,
    publicKey,
    fee,
    nonce,
    memo,
  } = options;

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

// Creates unsigned STX transfer transaction
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

// Creates either token or STX transfer transaction based on subAccount presence
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
    return createTokenTransferTransaction({
      contractAddress,
      contractName,
      assetName,
      amount,
      senderAddress,
      recipientAddress: recipient,
      anchorMode,
      network,
      publicKey,
      fee,
      nonce,
      memo,
    });
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

// Applies signature to transaction and returns serialized buffer
export const applySignatureToTransaction = (tx: StacksTransaction, signature: string): Buffer => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - TS doesn't recognize spendingCondition.signature property
  tx.auth.spendingCondition.signature = createMessageSignature(signature);
  return Buffer.from(tx.serialize());
};

// Recreates transaction from operation and applies signature for broadcast
// Used by the broadcast function - rawData type comes from internal ledger-live types
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

  if (isTokenTransferRawData(rawData)) {
    // TypeScript now knows rawData has all token transfer fields
    const { anchorMode, network, xpub, contractAddress, contractName, assetName } = rawData;

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
      nonce: operation.transactionSequenceNumber?.toString() ?? "0",
      postConditions,
    });

    return applySignatureToTransaction(tx, signature);
  } else {
    // STX transfer - extract base fields
    const { anchorMode, network, xpub } = extractBaseRawData(rawData);

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
