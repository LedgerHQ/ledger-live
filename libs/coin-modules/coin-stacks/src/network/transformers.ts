import { TransactionResponse } from "../types/api";
import { fetchFungibleTokenMetadataCached } from "./api";
import { TokenPrefix } from "../types";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";

// Extracts token transfer transactions from a transaction list
export const extractTokenTransferTransactions = (
  transactions: TransactionResponse[],
): TransactionResponse[] => {
  return transactions.filter(t => t.tx?.tx_type === "token_transfer");
};

// Extracts send-many transactions from a transaction list
export const extractSendManyTransactions = (
  transactions: TransactionResponse[],
): TransactionResponse[] => {
  return transactions.filter(
    t => t.tx?.tx_type === "contract_call" && t.tx.contract_call?.function_name === "send-many",
  );
};

// Fetches asset identifier from contract ID using metadata API
// Returns undefined if metadata fetch fails or no matching token found
const getAssetIdFromContractId = async (contractId: string): Promise<string | undefined> => {
  const metadata = await fetchFungibleTokenMetadataCached(contractId);

  if (metadata.results.length === 1) {
    // If there's only one result, use its asset_identifier
    return metadata.results[0].asset_identifier;
  }

  if (metadata.results.length > 1) {
    // If multiple results, find which one exists in the token registry
    for (const result of metadata.results) {
      const token = await getCryptoAssetsStore().findTokenById(
        TokenPrefix + result.asset_identifier,
      );
      if (token) {
        return result.asset_identifier;
      }
    }
  }

  // No metadata found or no matching token in registry
  return undefined;
};

// Resolves token ID to canonical form by checking cache, registry, and metadata
// Format: CONTRACT_ID::ASSET_NAME. Returns original if no resolution found
export const findFinalTokenId = async (
  tokenId: string,
  prevRecords: Record<string, string>,
): Promise<string> => {
  // Check if we've already resolved this token ID
  if (prevRecords[tokenId]) {
    return prevRecords[tokenId];
  }

  // Check if token exists in the local registry
  const registeredToken = await getCryptoAssetsStore().findTokenById(TokenPrefix + tokenId);

  if (registeredToken) {
    return tokenId;
  }

  // Parse the token ID to extract contract and asset information
  const [contractId, assetName] = tokenId.split("::");
  const [contractAddress, _] = contractId.split(".");

  // Fetch metadata from the blockchain (cached for performance)
  const metadata = await fetchFungibleTokenMetadataCached(contractAddress);

  // If only one result, use it as the canonical identifier
  if (metadata.results.length === 1) {
    return metadata.results[0].asset_identifier;
  }

  // Multiple results: find the one that matches our asset name and is in the registry
  for (const result of metadata.results) {
    const [, resultAssetName] = result.asset_identifier.split("::");

    // Check if this result matches our criteria:
    // 1. It exists in the token registry
    // 2. The asset name matches what we're looking for
    const isRegistered = await getCryptoAssetsStore().findTokenById(
      TokenPrefix + result.asset_identifier,
    );
    const isMatchingAsset = resultAssetName === assetName;

    if (isRegistered && isMatchingAsset) {
      return result.asset_identifier;
    }
  }

  // No better match found, return the original token ID
  return tokenId;
};

// Checks if transaction is a valid transfer call (not send-many)
const isValidTransferTransaction = (tx: TransactionResponse): boolean => {
  if (tx.tx?.tx_type !== "contract_call") return false;
  if (tx.tx.contract_call?.function_name === "send-many") return false;
  return tx.tx.contract_call?.function_name === "transfer";
};

// Extracts asset name from transaction post_conditions
const getAssetNameFromPostConditions = (tx: TransactionResponse): string | undefined => {
  return tx.tx.post_conditions?.find(p => p.type === "fungible")?.asset.asset_name;
};

// Determines token ID from contract ID and asset name
const resolveTokenId = async (
  contractId: string,
  assetName?: string,
): Promise<string | undefined> => {
  if (assetName) {
    return `${contractId}::${assetName}`;
  }

  // If no asset name from post_conditions, try fetching metadata
  return getAssetIdFromContractId(contractId);
};

// Adds transaction to the map grouped by token ID
const addTransactionToMap = (
  map: Record<string, TransactionResponse[]>,
  tokenId: string,
  tx: TransactionResponse,
): void => {
  if (!map[tokenId]) {
    map[tokenId] = [];
  }
  map[tokenId].push(tx);
};

// Extracts and groups contract transactions by token ID
export const extractContractTransactions = async (
  transactions: TransactionResponse[],
): Promise<Record<string, TransactionResponse[]>> => {
  const contractTxsMap: Record<string, TransactionResponse[]> = {};
  const finalTokenIdMap: Record<string, string> = {};

  for (const tx of transactions) {
    if (!isValidTransferTransaction(tx)) continue;

    const contractId = tx.tx.contract_call?.contract_id;
    if (!contractId) continue;

    const assetName = getAssetNameFromPostConditions(tx);
    const tokenId = await resolveTokenId(contractId, assetName);

    if (!tokenId) continue;

    // Resolve to final token ID
    const finalTokenId = await findFinalTokenId(tokenId, finalTokenIdMap);
    finalTokenIdMap[tokenId] = finalTokenId;

    addTransactionToMap(contractTxsMap, finalTokenId, tx);
  }

  return contractTxsMap;
};
