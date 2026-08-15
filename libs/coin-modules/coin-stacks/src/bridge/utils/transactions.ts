import { TokenAccount } from "@ledgerhq/types-live";
import { makeUnsignedContractCall, AnchorMode, StacksTransactionWire } from "@stacks/transactions";
import type { StacksNetworkName } from "@stacks/network";
import BigNumber from "bignumber.js";
import { StacksOperation, Transaction } from "../../types";
import {
  applySignatureToTransaction,
  createStxTransferTransaction,
  createTokenTransferFunctionArgs,
  createTokenTransferPostConditions,
  createTokenTransferTransaction,
} from "../../common-logic";

type BaseRawData = {
  // @stacks/transactions@7 dropped AnchorMode from every builder below; kept only for
  // call-site compatibility with older rawData payloads, never actually used.
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
    typeof data.network === "string" &&
    typeof data.xpub === "string"
  );
}

// Extracts and validates base fields from rawData (throws if invalid)
function extractBaseRawData(data: Record<string, unknown>): BaseRawData {
  const network = data.network;
  const xpub = data.xpub;

  if (typeof network !== "string" || typeof xpub !== "string") {
    throw new Error("Invalid raw data: missing or invalid base fields");
  }

  const anchorMode = typeof data.anchorMode === "number" ? data.anchorMode : AnchorMode.Any;

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

// Creates either token or STX transfer transaction based on subAccount presence
export const createTransaction = async (
  transaction: Transaction,
  senderAddress: string,
  publicKey: string,
  subAccount?: TokenAccount,
  fee?: BigNumber,
  nonce?: BigNumber,
): Promise<StacksTransactionWire> => {
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
    return createStxTransferTransaction(amount, recipient, anchorMode, network, publicKey, {
      fee,
      nonce,
      memo,
    });
  }
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
    const { network, xpub, contractAddress, contractName, assetName } = rawData;

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
      network: network as StacksNetworkName,
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
      {
        fee: new BigNumber(fee),
        nonce: new BigNumber(operation.transactionSequenceNumber ?? 0),
        memo: memo !== undefined && memo !== null ? String(memo) : undefined,
      },
    );

    return applySignatureToTransaction(tx, signature);
  }
};
