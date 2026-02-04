import type {
  Balance,
  Block,
  BlockInfo,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  MemoNotSupported,
  Pagination,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-framework/api/types";
import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
import { getEnv } from "@ledgerhq/live-env";

import MultiversXApiClient from "./apiCalls";
import type { MultiversXApi, MultiversXApiConfig } from "./types";
import { GAS, GAS_PRICE, MIN_GAS_LIMIT } from "../constants";
import { getBalance } from "../logic/getBalance";
import { getSequence } from "../logic/getSequence";
import { listOperations } from "../logic/listOperations";
import { getStakes } from "../logic/getStakes";
import { getValidators as doGetValidators } from "../logic/getValidators";
import {
  craftTransaction as doCraftTransaction,
  getDefaultGasLimit,
} from "../logic/craftTransaction";
import { combine as doCombine } from "../logic/combine";
import { broadcast as doBroadcast } from "../logic/broadcast";
import { validateIntent as doValidateIntent } from "../logic/validateIntent";
import { estimateFees as doEstimateFees } from "../logic/estimateFees";
import type { MultiversXTransactionMode } from "../types";

/**
 * Maps staking intent type to MultiversX transaction mode.
 * Handles various naming conventions for staking operations.
 * @param type - The staking intent type from TransactionIntent
 * @returns The corresponding MultiversX transaction mode
 * @throws Error if the staking type is not supported
 */
function mapStakingTypeToMode(type: string): MultiversXTransactionMode {
  const typeMap: Record<string, MultiversXTransactionMode> = {
    // Standard naming
    delegate: "delegate",
    undelegate: "unDelegate", // Note: lowercase 'd' in intent, capital 'D' in mode
    unDelegate: "unDelegate",
    claimRewards: "claimRewards",
    claim_rewards: "claimRewards",
    withdraw: "withdraw",
    reDelegateRewards: "reDelegateRewards",
    redelegate_rewards: "reDelegateRewards",
    redelegateRewards: "reDelegateRewards",
  };
  
  const mode = typeMap[type];
  if (!mode) {
    throw new Error(`craftTransaction failed: unsupported staking type "${type}"`);
  }
  
  return mode;
}


/**
 * Create a MultiversX API instance.
 * @param config - Optional configuration for API endpoints
 * @returns MultiversXApi instance implementing the Alpaca API interface
 */
export function createApi(config?: MultiversXApiConfig): MultiversXApi {
  const apiEndpoint = config?.apiEndpoint ?? getEnv("MULTIVERSX_API_ENDPOINT");
  const delegationApiEndpoint =
    config?.delegationApiEndpoint ?? getEnv("MULTIVERSX_DELEGATION_API_ENDPOINT") ?? apiEndpoint;

  // Instantiate internal clients now, so all API methods share the same configuration.
  const apiClient = new MultiversXApiClient(apiEndpoint, delegationApiEndpoint);

  return {
    /**
     * Broadcasts a signed transaction to the MultiversX network.
     * @param signedTx - JSON string from combine() containing signed transaction
     * @returns Transaction hash as string
     * @throws Error if signedTx is malformed JSON or missing required fields
     * @throws Error if network call fails (with network error message)
     */
    broadcast: async (signedTx: string) => {
      return doBroadcast(signedTx, apiClient);
    },
    /**
     * Combines an unsigned transaction with a signature to produce a signed transaction.
     * @param tx - JSON string from craftTransaction containing unsigned transaction
     * @param signature - Hex-encoded signature from hardware wallet
     * @param pubkey - Optional public key (not used for MultiversX)
     * @returns JSON string containing signed transaction ready for broadcast
     */
    combine: (tx: string, signature: string, pubkey?: string) => {
      void apiClient;
      return doCombine(tx, signature, pubkey);
    },
    /**
     * Craft an unsigned transaction for signing.
     * Supports native EGLD transfers, ESDT token transfers, and delegation operations.
     * @param transactionIntent - The transaction intent describing what to send or stake
     * @param customFees - Optional custom fee estimation with gasLimit in parameters
     * @returns CraftedTransaction with serialized unsigned transaction JSON
     */
    craftTransaction: async (
      transactionIntent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
      customFees?: FeeEstimation,
    ): Promise<CraftedTransaction> => {
      // Determine if this is a staking intent
      const isStakingIntent = transactionIntent.intentType === "staking";

      // Validate send intents have proper asset type
      if (!isStakingIntent) {
        // For send intents, validate intent type and asset type
        if (!isSendTransactionIntent(transactionIntent)) {
          throw new Error(
            "craftTransaction failed: invalid intent type - expected 'transaction' or 'staking'",
          );
        }

        const assetType = transactionIntent.asset.type;
        if (assetType !== "native" && assetType !== "esdt") {
          throw new Error(`craftTransaction failed: unsupported asset type "${assetType}"`);
        }
      } else {
        // For staking intents, validate asset type must be native
        if (transactionIntent.asset.type !== "native") {
          throw new Error(
            `craftTransaction failed: staking intents must have asset.type === "native", got "${transactionIntent.asset.type}"`,
          );
        }
        
        // Validate recipient is a validator contract address (erd1qqqq...)
        if (!transactionIntent.recipient.startsWith("erd1qqqq")) {
          throw new Error(
            `craftTransaction failed: staking recipient must be a validator contract address (erd1qqqq...), got "${transactionIntent.recipient}"`,
          );
        }
      }

      // Determine transaction mode
      let mode: MultiversXTransactionMode = "send";
      if (isStakingIntent) {
        // Map staking intent type to MultiversX transaction mode
        mode = mapStakingTypeToMode(transactionIntent.type);
      }

      // Determine if this is an ESDT transfer
      const assetType = transactionIntent.asset.type;
      const isEsdtTransfer = !isStakingIntent && assetType === "esdt";

      // Extract token identifier for ESDT transfers from assetReference (AC#3)
      // Validate assetReference is non-empty if provided
      const rawAssetReference =
        isEsdtTransfer && "assetReference" in transactionIntent.asset
          ? transactionIntent.asset.assetReference
          : undefined;
      const tokenIdentifier =
        rawAssetReference && rawAssetReference.length > 0 ? rawAssetReference : undefined;

      // Validate tokenIdentifier is required for ESDT transfers
      if (isEsdtTransfer && (!tokenIdentifier || tokenIdentifier.length === 0)) {
        throw new Error("craftTransaction failed: tokenIdentifier is required for ESDT transfers");
      }

      // Fetch nonce if not provided in intent
      const nonce =
        transactionIntent.sequence !== undefined
          ? Number(transactionIntent.sequence)
          : Number(await getSequence(apiClient, transactionIntent.sender));

      // Determine default gas limit based on transfer/staking type
      const defaultGasLimit = getDefaultGasLimit(mode, isEsdtTransfer);

      // Extract gasLimit from custom fees if provided, otherwise use default
      const gasLimit =
        customFees?.parameters?.gasLimit !== undefined
          ? Number(customFees.parameters.gasLimit)
          : defaultGasLimit;

      // Determine gas price: custom > default constant
      // Priority: customFees.parameters.gasPrice > GAS_PRICE constant
      const gasPrice =
        customFees?.parameters?.gasPrice !== undefined
          ? typeof customFees.parameters.gasPrice === "bigint"
            ? customFees.parameters.gasPrice
            : BigInt(customFees.parameters.gasPrice)
          : BigInt(GAS_PRICE);

      // Calculate amount - handle useAllAmount flag
      let amount = transactionIntent.amount;
      if (transactionIntent.useAllAmount && !isStakingIntent) {
        // Fetch sender's balance
        const balances = await getBalance(apiClient, transactionIntent.sender);

        if (isEsdtTransfer) {
          // For ESDT, find the matching token balance
          const tokenBalance = balances.find(
            b => b.asset.type === "esdt" && "assetReference" in b.asset && b.asset.assetReference === tokenIdentifier,
          );
          if (!tokenBalance) {
            throw new Error(`craftTransaction failed: unable to fetch balance for token ${tokenIdentifier} with useAllAmount`);
          }
          
          // CRITICAL: Verify account has enough EGLD to pay for gas fees
          const nativeBalance = balances.find(b => b.asset.type === "native");
          if (!nativeBalance) {
            throw new Error("craftTransaction failed: unable to fetch native balance for ESDT transfer gas fees");
          }
          
          // Calculate fee (gasLimit * gasPrice)
          const fee = BigInt(gasLimit) * gasPrice;
          
          // Verify native balance covers gas fees
          if (nativeBalance.value < fee) {
            throw new Error(`craftTransaction failed: insufficient EGLD balance (${nativeBalance.value}) to cover gas fees (${fee}) for ESDT transfer`);
          }
          
          amount = tokenBalance.value;
        } else {
          // For native EGLD, deduct fees
          const nativeBalance = balances.find(b => b.asset.type === "native");
          if (!nativeBalance) {
            throw new Error("craftTransaction failed: unable to fetch native balance for useAllAmount");
          }

          // Calculate fee (gasLimit * gasPrice)
          const fee = BigInt(gasLimit) * gasPrice;

          // Amount = balance - fee (ensure non-negative)
          amount = nativeBalance.value - fee;
          if (amount < 0n) {
            throw new Error("craftTransaction failed: insufficient balance to cover fees with useAllAmount");
          }
        }
      }

      // Call logic function to craft the transaction
      return doCraftTransaction({
        sender: transactionIntent.sender,
        recipient: transactionIntent.recipient, // Validator contract for staking intents
        amount,
        nonce,
        gasLimit,
        mode,
        tokenIdentifier,
      });
    },
    /**
     * Craft raw transaction (not supported).
     * MultiversX uses structured JSON transactions, not raw byte-level construction.
     * Use craftTransaction() instead for all transaction types.
     * @param _transaction - Raw transaction bytes (ignored)
     * @param _sender - Sender address (ignored)
     * @param _publicKey - Public key (ignored)
     * @param _sequence - Sequence number (ignored)
     */
    craftRawTransaction: async (
      _transaction: string,
      _sender: string,
      _publicKey: string,
      _sequence: bigint,
    ) => {
      void apiClient;
      throw new Error("craftRawTransaction is not supported");
    },
    /**
     * Estimates fees for a transaction intent.
     * Supports native EGLD transfers, ESDT token transfers, and delegation operations.
     * Fetches current network gas price from network config (AC4 requirement).
     * @param transactionIntent - The transaction intent to estimate fees for
     * @param customFeesParameters - Optional custom fee parameters (gasLimit, gasPrice)
     * @returns FeeEstimation with total fee value and gas parameters
     * @throws Error if network config fetch fails (falls back to constant if network unavailable)
     */
    estimateFees: async (
      transactionIntent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
      customFeesParameters?: FeeEstimation["parameters"],
    ) => {
      // Fetch current network gas price (AC4 requirement)
      // If custom gas price is provided, skip network fetch for efficiency
      let networkGasPrice: bigint | undefined;
      if (!customFeesParameters?.gasPrice) {
        try {
          const networkConfig = await apiClient.getNetworkConfig();
          networkGasPrice = BigInt(networkConfig.gasPrice);
        } catch (error) {
          // If network fetch fails, fall back to constant (should log in production)
          // This ensures the function doesn't fail completely if network is unavailable
          networkGasPrice = undefined;
        }
      }

      return doEstimateFees(transactionIntent, customFeesParameters, networkGasPrice);
    },
    /**
     * Retrieves native EGLD and ESDT token balances for a MultiversX address.
     * @param address - MultiversX bech32 address (erd1...)
     * @returns Array of Balance objects (native first, then ESDT tokens; never empty per FR4)
     * @throws Error if address is invalid or network request fails
     */
    getBalance: async (address: string) => {
      return getBalance(apiClient, address);
    },
    /**
     * Get the current block height from the MultiversX network.
     * @returns BlockInfo with current block height
     */
    lastBlock: async (): Promise<BlockInfo> => {
      const height = await apiClient.getBlockchainBlockHeight();
      return { height };
    },
    /**
     * Lists historical operations for a MultiversX address with pagination.
     * @param address - MultiversX bech32 address (erd1...)
     * @param pagination - Pagination options (limit, minHeight, order, pagingToken)
     * @returns Tuple of [Operation[], nextCursor] where cursor is for next page
     * @throws Error if address is invalid or network request fails
     */
    listOperations: async (address: string, pagination: Pagination) => {
      return listOperations(apiClient, address, pagination);
    },
    /**
     * Validates a transaction intent against account balances.
     * @param transactionIntent - The transaction intent to validate
     * @param balances - Current account balances (from getBalance)
     * @param customFees - Optional fee estimation (from estimateFees)
     * @returns TransactionValidation with errors, warnings, and calculated amounts
     */
    validateIntent: async (
      transactionIntent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
      balances: Balance[],
      customFees?: FeeEstimation,
    ) => {
      return doValidateIntent(transactionIntent, balances, customFees);
    },
    /**
     * Retrieves the account nonce (sequence number) for transaction ordering.
     * @param address - MultiversX bech32 address (erd1...)
     * @returns Account nonce as bigint (0n for new accounts)
     * @throws Error if address is invalid or network request fails
     */
    getSequence: async (address: string) => {
      return getSequence(apiClient, address);
    },
    /**
     * Get block by height (not supported).
     * @param _height - Block height
     */
    getBlock: async (_height: number): Promise<Block> => {
      void apiClient;
      throw new Error("getBlock is not supported");
    },
    /**
     * Get block info by height (not supported).
     * @param _height - Block height
     */
    getBlockInfo: async (_height: number): Promise<BlockInfo> => {
      void apiClient;
      throw new Error("getBlockInfo is not supported");
    },
    /**
     * Get delegation positions (stakes) for an address.
     * @param address - MultiversX address to query delegations for
     * @param _cursor - Optional cursor for pagination (not used - delegation API doesn't paginate)
     * @returns Page containing Stake objects
     */
    getStakes: async (address: string, _cursor?: Cursor) => {
      void _cursor; // Pagination not supported by MultiversX delegation API
      return getStakes(apiClient, address);
    },
    /**
     * Get rewards (not supported).
     * @param _address - MultiversX address
     * @param _cursor - Optional cursor for pagination
     */
    getRewards: async (_address: string, _cursor?: Cursor) => {
      void apiClient;
      throw new Error("getRewards is not supported");
    },
    /**
     * Retrieves the list of available validators for delegation.
     * @param _cursor - Optional pagination cursor (not used - API returns all validators)
     * @returns Page containing all active validators with APR, identity, and commission
     * @throws Error if network request fails
     */
    getValidators: async (_cursor?: Cursor) => {
      void _cursor; // Pagination not supported by MultiversX delegation API
      return doGetValidators(apiClient);
    },
  };
}

// Re-export existing SDK functions for backward compatibility
export {
  getAccount,
  getNetworkConfig,
  getProviders,
  getEGLDOperations,
  getFees,
  broadcastTransaction,
  getAccountESDTTokens,
  getAccountDelegations,
  getESDTOperations,
  hasESDTTokens,
  getAccountNonce,
} from "./sdk";

// Export types
export type { MultiversXApi, MultiversXApiConfig } from "./types";
