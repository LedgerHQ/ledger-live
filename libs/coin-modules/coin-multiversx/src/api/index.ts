import type {
  AddressValidationCurrencyParameters,
  Balance,
  Block,
  BlockInfo,
  CraftedTransaction,
  Cursor,
  FeeEstimation,
  MemoNotSupported,
  ListOperationsOptions,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/index";
import { craftTransactionData } from "@ledgerhq/coin-module-framework/logic/craftTransactionData";
import { getEnv } from "@ledgerhq/live-env";

import MultiversXApiClient from "./apiCalls";
import type { MultiversXApi, MultiversXApiConfig } from "./types";
import { GAS_PRICE } from "../constants";
import { getBalance } from "../logic/getBalance";
import { getSequence } from "../logic/getSequence";
import { listOperations } from "../logic/listOperations";
import { getStakes } from "../logic/getStakes";
import { getValidators as doGetValidators } from "../logic/getValidators";
import {
  craftTransaction as doCraftTransaction,
  getDefaultGasLimit,
  isStakingIntent,
  mapStakingTypeToMode,
} from "../logic/craftTransaction";
import { combine as doCombine } from "../logic/combine";
import { broadcast } from "../logic/broadcast";
import { validateIntent as doValidateIntent } from "../logic/validateIntent";
import { validateAddress as doValidateAddress } from "../logic/validateAddress";
import { estimateFees as doEstimateFees } from "../logic/estimateFees";
import type { MultiversXTransactionMode } from "../types";

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
    broadcast: (signedTx: string) => broadcast(signedTx, apiClient),
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
      // Intent validation (intent/asset type, staking type, validator contract,
      // required token identifier) is the responsibility of validateIntent. Here we
      // assume a validated intent and only map it to a craftable transaction.
      const isStaking = isStakingIntent(transactionIntent);

      // Determine transaction mode (staking type -> mode, or a plain "send").
      const mode: MultiversXTransactionMode = isStaking
        ? mapStakingTypeToMode(transactionIntent.type)
        : "send";

      // Determine if this is an ESDT transfer and extract its token identifier.
      const assetType = transactionIntent.asset.type;
      const isEsdtTransfer = !isStaking && assetType === "esdt";
      const rawAssetReference =
        isEsdtTransfer && "assetReference" in transactionIntent.asset
          ? transactionIntent.asset.assetReference
          : undefined;
      const tokenIdentifier =
        rawAssetReference && rawAssetReference.length > 0 ? rawAssetReference : undefined;

      // Fetch nonce if not provided in intent
      const nonce =
        transactionIntent.sequence !== undefined
          ? Number(transactionIntent.sequence)
          : Number(await getSequence(apiClient, transactionIntent.sender));

      // Fetch the chain id from the network so non-mainnet networks (devnet/testnet/
      // local simulator) produce valid transactions. Falls back to the mainnet
      // CHAIN_ID constant in doCraftTransaction when the fetch fails.
      let chainID: string | undefined;
      try {
        chainID = (await apiClient.getNetworkConfig()).chainID;
      } catch {
        chainID = undefined;
      }

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
            : BigInt(GAS_PRICE)
          : BigInt(GAS_PRICE);

      // Calculate amount - handle useAllAmount flag
      let amount = transactionIntent.amount;
      if (transactionIntent.useAllAmount && !isStaking) {
        // Fetch sender's balance
        const balances = await getBalance(apiClient, transactionIntent.sender);

        if (isEsdtTransfer) {
          // For ESDT, find the matching token balance
          const tokenBalance = balances.find(
            b =>
              b.asset.type === "esdt" &&
              "assetReference" in b.asset &&
              b.asset.assetReference === tokenIdentifier,
          );
          if (!tokenBalance) {
            throw new Error(
              `craftTransaction failed: unable to fetch balance for token ${tokenIdentifier} with useAllAmount`,
            );
          }

          // CRITICAL: Verify account has enough EGLD to pay for gas fees
          const nativeBalance = balances.find(b => b.asset.type === "native");
          if (!nativeBalance) {
            throw new Error(
              "craftTransaction failed: unable to fetch native balance for ESDT transfer gas fees",
            );
          }

          // Calculate fee (gasLimit * gasPrice)
          const fee = BigInt(gasLimit) * gasPrice;

          // Verify native balance covers gas fees
          if (nativeBalance.value < fee) {
            throw new Error(
              `craftTransaction failed: insufficient EGLD balance (${nativeBalance.value}) to cover gas fees (${fee}) for ESDT transfer`,
            );
          }

          amount = tokenBalance.value;
        } else {
          // For native EGLD, deduct fees
          const nativeBalance = balances.find(b => b.asset.type === "native");
          if (!nativeBalance) {
            throw new Error(
              "craftTransaction failed: unable to fetch native balance for useAllAmount",
            );
          }

          // Calculate fee (gasLimit * gasPrice)
          const fee = BigInt(gasLimit) * gasPrice;

          // Amount = balance - fee (ensure non-negative)
          amount = nativeBalance.value - fee;
          if (amount < 0n) {
            throw new Error(
              "craftTransaction failed: insufficient balance to cover fees with useAllAmount",
            );
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
        tokenIdentifier: tokenIdentifier ?? "",
        chainID,
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

      return { height, hash: "", time: new Date(Date.now()) };
    },
    /**
     * Lists historical operations for a MultiversX address with pagination.
     * @param address - MultiversX bech32 address (erd1...)
     * @param options - ListOperationsOptions options (limit, minHeight, order, cursor)
     * @returns A Page of Operation objects with an optional next cursor
     * @throws Error if address is invalid or network request fails
     */
    listOperations: async (address: string, options: ListOperationsOptions) => {
      return listOperations(apiClient, address, options);
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
    getNextSequence: async (address: string) => {
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
    /**
     * Validates a MultiversX address.
     * @param address - The address to validate
     * @param parameters - Optional address validation parameters
     * @returns true if the address is valid
     */
    validateAddress: (
      address: string,
      parameters: Partial<AddressValidationCurrencyParameters>,
    ) => {
      return doValidateAddress(address, parameters);
    },
    craftTransactionData,
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
