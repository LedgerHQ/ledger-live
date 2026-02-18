import { Stake } from "@ledgerhq/coin-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { withApi } from "../network/node/rpc.common";
import type {
  StakeCreate,
  StakingContractConfig,
  StakingStrategy,
  StakingExtractor,
} from "../types/staking";
import { extractSeiDelegation, getSeiDelegationAmount, getCeloAmount } from "../utils";
import { encodeStakingData, decodeStakingResult } from "./encoder";
import { buildTransactionParams } from "./transactionData";
import { getValidators } from "./validators";

/**
 * Generic staking fetcher that adapts to different blockchain requirements
 */
const createStakingFetcher = (
  getValidatorsFn: (config: StakingContractConfig, currency: CryptoCurrency) => Promise<string[]>,
) => {
  return async (
    address: string,
    config: StakingContractConfig,
    currency: CryptoCurrency,
  ): Promise<Stake[]> => {
    const validators = await getValidatorsFn(config, currency);
    const logPrefix = currency.id === "sei_evm" ? "SEI" : "CELO";
    return getStakesForValidators(address, config, currency, validators, logPrefix);
  };
};

export const STAKING_CONFIG: Record<string, StakingStrategy> = {
  sei_evm: {
    fetcher: createStakingFetcher(
      async (config, currency) => await getValidators(currency.id, config.apiConfig),
    ),
  },
  celo: {
    fetcher: createStakingFetcher(async config => [config.contractAddress]),
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

const createStakeFromContract = async (stakingContract: StakeCreate): Promise<Stake | null> => {
  const { currency, config, address, currencyId, validatorAddress } = stakingContract;

  return withApi(currency, async rpcProvider => {
    try {
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
        details: {
          contractAddress: config.contractAddress,
          validator: validatorAddress,
        },
      };
    } catch (error) {
      console.error("Staking fetch failed", error);
      return null;
    }
  });
};

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

  // Parallel RPC calls for better performance
  const stakePromises = validators.map(validator =>
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

  const results = await Promise.allSettled(stakePromises);
  const stakes: Stake[] = [];

  results.forEach(result => {
    if (result.status === "fulfilled" && result.value) {
      stakes.push(result.value);
    }
  });

  return stakes;
};
