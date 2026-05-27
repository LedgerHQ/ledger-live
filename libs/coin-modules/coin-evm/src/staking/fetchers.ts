import { Stake } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { delay } from "@ledgerhq/live-promise";
import { getCoinConfig } from "../config";
import { withApi } from "../network/node/rpc.common";
import { isExternalNodeConfig } from "../network/node/types";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import type {
  StakeCreate,
  StakingContractConfig,
  StakingExtractor,
  StakingStrategy,
} from "../types/staking";
import { extractSeiDelegation, getCeloAmount, getSeiDelegationAmount } from "../utils";
import { encodeStakingData, decodeStakingResult } from "./encoder";
import { buildTransactionParams } from "./transactionData";
import { getValidators } from "./validators";

/**
 * Generic staking fetcher that adapts to different blockchain requirements
 */
const createStakingFetcher = (
  getValidatorsFn: (
    config: StakingContractConfig,
    currency: CryptoCurrency,
  ) => Promise<StakingValidatorItem[]>,
) => {
  return async (
    address: string,
    config: StakingContractConfig,
    currency: CryptoCurrency,
  ): Promise<Stake[]> => {
    const validators = await getValidatorsFn(config, currency);
    const validatorAddresses = validators.map(v => v.validatorAddress);
    const logPrefix = currency.id === "sei_evm" ? "SEI" : "CELO";
    return getStakesForValidators(address, config, currency, validatorAddresses, logPrefix);
  };
};

export const STAKING_CONFIG: Record<string, StakingStrategy> = {
  sei_evm: {
    fetcher: createStakingFetcher(
      async (config, currency) => await getValidators(currency.id, config.apiConfig),
    ),
  },
  celo: {
    fetcher: createStakingFetcher(async config => [
      {
        validatorAddress: config.contractAddress,
        name: "",
        commission: 0,
        tokens: 0,
        votingPower: 0,
        estimatedYearlyRewardsRate: 0,
      },
    ]),
  },
};

const AMOUNT_EXTRACTORS: Record<string, StakingExtractor> = {
  sei_evm: (decoded: unknown): bigint => {
    const delegation = extractSeiDelegation(decoded);
    return getSeiDelegationAmount(delegation);
  },
  celo: getCeloAmount,
};

const getAmountFromDecoded = (currencyId: string, decoded: unknown): bigint => {
  const extractor = AMOUNT_EXTRACTORS[currencyId];
  return extractor ? extractor(decoded) : 0n;
};

const isMissingRevertDataCallException = (error: unknown): boolean => {
  if (!(error instanceof Error) || !("code" in error)) {
    return false;
  }

  const message =
    "shortMessage" in error && typeof error.shortMessage === "string"
      ? error.shortMessage
      : error.message;

  return (
    error.code === "CALL_EXCEPTION" &&
    (!("data" in error) || error.data === null) &&
    (!("reason" in error) || error.reason === null) &&
    (!("revert" in error) || error.revert === null) &&
    message.includes("missing revert data")
  );
};

const isSeiMissingDelegationError = (currencyId: string, error: unknown): boolean =>
  currencyId === "sei_evm" && isMissingRevertDataCallException(error);

// Short retry delay for staking calls. The staking precompile returns
// CALL_EXCEPTION with "missing revert data" both for genuine no-delegation AND
// for transient RPC failures. A brief retry distinguishes the two cases: a real
// "no delegation" responds consistently, a transient failure resolves quickly.
const STAKING_RETRY_DELAY_MS = 300;

// TODO: tech debt: the call should be implemented in the node API as an optional function (like traceBlock)
const createStakeFromContract = async (stakingContract: StakeCreate): Promise<Stake | null> => {
  const { currency, config, address, currencyId, validatorAddress } = stakingContract;
  const node = getCoinConfig(currency.id).info.node;
  if (!isExternalNodeConfig(node)) {
    throw new Error("Currency doesn't have an RPC node provided");
  }

  return withApi(
    currency,
    async rpcProvider => {
      const executeCall = async (): Promise<Stake | null> => {
        const params = buildTransactionParams(
          currencyId,
          "getStakedBalance",
          address,
          0n,
          validatorAddress,
          address,
        );
        const encodedData = encodeStakingData({
          currencyId,
          operation: "getStakedBalance",
          config,
          params,
        });

        const result = await rpcProvider.call({
          to: config.contractAddress,
          data: encodedData,
        });
        const decoded = decodeStakingResult(currencyId, "getStakedBalance", config, result);
        const amount = getAmountFromDecoded(currencyId, decoded);

        if (amount === 0n) {
          return null;
        }

        return {
          uid: `${config.contractAddress}-${validatorAddress}-${address}`,
          address,
          delegate: validatorAddress,
          state: "active",
          asset: {
            type: "native",
            name: currency.name,
            unit: currency.units[0],
          },
          amount,
          actions: [],
          details: {
            contractAddress: config.contractAddress,
            validator: validatorAddress,
          },
        };
      };

      try {
        return await executeCall();
      } catch (error) {
        if (isSeiMissingDelegationError(currencyId, error)) {
          // The SEI staking precompile returns CALL_EXCEPTION with "missing revert
          // data" both when there is genuinely no delegation AND on transient RPC
          // failures. Retry once after a brief delay: a genuine no-delegation
          // responds consistently; a transient failure resolves on the retry.
          await delay(STAKING_RETRY_DELAY_MS);

          try {
            return await executeCall();
          } catch (retryError) {
            if (isSeiMissingDelegationError(currencyId, retryError)) {
              return null; // Consistent CALL_EXCEPTION — genuinely no delegation
            }
            throw new Error(
              "Retry error: " +
                (retryError instanceof Error ? retryError.message : String(retryError)),
            ); // Let withRetries handle other errors
          }
        }
        // Re-throw non-SEI errors so withApi's withRetries can retry them
        throw new Error("Error: " + (error instanceof Error ? error.message : String(error)));
      }
    },
    node,
  );
};

// Limit concurrent RPC calls to avoid overloading the node and causing
// silent failures that get incorrectly interpreted as "no delegation".
const STAKE_FETCH_BATCH_SIZE = 10;

const getStakesForValidators = async (
  address: string,
  config: StakingContractConfig,
  currency: CryptoCurrency,
  validators: string[],
  logPrefix: string = "Staking",
): Promise<Stake[]> => {
  if (validators.length === 0) {
    console.error(`No validators available for ${logPrefix}`, { currencyId: currency.id });
    return [];
  }

  const allResults: PromiseSettledResult<Stake | null>[] = [];

  // Process validators in batches to avoid overwhelming the RPC node.
  // Firing all N validators in parallel triggers rate-limiting / connection
  // exhaustion on the provider, which causes requests to fail silently
  // (caught → null) and delegations to disappear from the UI.
  for (let i = 0; i < validators.length; i += STAKE_FETCH_BATCH_SIZE) {
    const chunk = validators.slice(i, i + STAKE_FETCH_BATCH_SIZE);
    const chunkPromises = chunk.map(validator =>
      createStakeFromContract({
        address,
        config,
        currencyId: currency.id,
        currency,
        validatorAddress: validator,
      }).catch(error => {
        console.error(`Failed to fetch ${logPrefix} stake for validator`, {
          validator,
          currencyId: currency.id,
          address,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }),
    );
    const chunkResults = await Promise.allSettled(chunkPromises);
    allResults.push(...chunkResults);
  }

  const stakes: Stake[] = [];

  allResults.forEach(result => {
    if (result.status === "fulfilled" && result.value) {
      stakes.push(result.value);
    }
  });

  return stakes;
};
