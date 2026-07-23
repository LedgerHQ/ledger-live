import { ethers, type JsonRpcProvider } from "ethers";
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import type { Page } from "@ledgerhq/coin-module-framework/api/index";
import type { AssetInfo, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { isExternalNodeConfig } from "../../network/node/types";
import type { StakingContractConfig } from "../../types/staking";
import { getStakingABI } from "../abis";
import { STAKING_CONTRACTS } from "../contracts";
import type { ValidatorApi } from "./types";

type ExploreMe0gValidator = {
  addr: string;
  moniker: string | null;
  commission_pct: string;
  voting_power_tokens: string;
};

function isExploreMe0gValidator(value: unknown): value is ExploreMe0gValidator {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "addr" in value &&
    typeof value.addr === "string" &&
    "moniker" in value &&
    (value.moniker === null || typeof value.moniker === "string") &&
    "commission_pct" in value &&
    typeof value.commission_pct === "string" &&
    "voting_power_tokens" in value &&
    typeof value.voting_power_tokens === "string"
  );
}

const zeroGravityValidatorApi: ValidatorApi = {
  fetchValidators: async (currencyId): Promise<Page<StakingValidatorItem>> => {
    const apiConfig = STAKING_CONTRACTS[currencyId]?.apiConfig;
    if (!apiConfig?.baseUrl) return { items: [], next: undefined };

    const { baseUrl, validatorsEndpoint } = apiConfig;

    try {
      const { data } = await network({
        url: `${baseUrl}${validatorsEndpoint}`,
        method: "GET",
      });

      const items: StakingValidatorItem[] = Array.isArray(data)
        ? data.filter(isExploreMe0gValidator).map((v, index) => {
            const validatorAddress = ethers.getAddress("0x" + v.addr);
            return {
              validatorAddress,
              name: v.moniker ?? validatorAddress,
              commission: parseFloat(v.commission_pct) / 100,
              tokens: v.voting_power_tokens,
              votingPower: index,
              estimatedYearlyRewardsRate: 0,
            };
          })
        : [];

      return { items, next: undefined };
    } catch (error) {
      log("coin-evm/staking", "fetchValidators: 0G validators fetch failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { items: [], next: undefined };
    }
  },
};

const DETAILS_BATCH_SIZE = 10;

type GetDelegationResult = [string, bigint];

function isGetDelegationResult(value: unknown): value is GetDelegationResult {
  return Array.isArray(value) && typeof value[0] === "string" && typeof value[1] === "bigint";
}

const fetchStakeForValidator = async (
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  validatorAddress: string,
  delegatorAddress: string,
  asset: AssetInfo,
): Promise<Stake | null> => {
  const getDelegationData = iface.encodeFunctionData("getDelegation", [delegatorAddress]);
  const rawDelegation = await provider.call({ to: validatorAddress, data: getDelegationData });
  const decodedDelegation = iface.decodeFunctionResult("getDelegation", rawDelegation);

  if (!isGetDelegationResult(decodedDelegation)) return null;

  const [, shares] = decodedDelegation;
  if (shares === 0n) return null;

  const convertData = iface.encodeFunctionData("convertToTokens", [shares]);
  const rawAmount = await provider.call({ to: validatorAddress, data: convertData });
  const decodedAmount = iface.decodeFunctionResult("convertToTokens", rawAmount);
  const amount =
    Array.isArray(decodedAmount) && typeof decodedAmount[0] === "bigint" ? decodedAmount[0] : 0n;

  if (amount === 0n) return null;

  return {
    uid: `${validatorAddress}-${delegatorAddress}`,
    address: delegatorAddress,
    delegate: validatorAddress,
    state: "active",
    asset,
    amount,
    actions: [],
    details: { contractAddress: validatorAddress, validator: validatorAddress },
  };
};

export const fetchZeroGravityStakes = async (
  address: string,
  _config: StakingContractConfig,
  currency: CryptoCurrency,
): Promise<Stake[]> => {
  const abi = getStakingABI(currency.id);
  if (!abi) return [];

  const node = getCoinConfig(currency.id).info.node;
  if (!isExternalNodeConfig(node)) return [];

  const { items: validators } = await zeroGravityValidatorApi.fetchValidators(currency.id);
  if (validators.length === 0) return [];

  const asset: AssetInfo = {
    type: "native",
    name: currency.name,
    unit: currency.units[0],
  };

  try {
    return await withApi(
      currency,
      async provider => {
        const iface = new ethers.Interface(abi as ethers.InterfaceAbi);
        const stakes: Stake[] = [];

        for (let i = 0; i < validators.length; i += DETAILS_BATCH_SIZE) {
          const chunk = validators.slice(i, i + DETAILS_BATCH_SIZE);
          const settled = await Promise.allSettled(
            chunk.map(({ validatorAddress: valAddr }) =>
              fetchStakeForValidator(provider, iface, valAddr, address, asset),
            ),
          );

          settled.forEach((res, idx) => {
            if (res.status === "rejected") {
              log("coin-evm/staking", "fetchZeroGravityStakes: getDelegation call failed", {
                validator: chunk[idx].validatorAddress,
                error: res.reason instanceof Error ? res.reason.message : String(res.reason),
              });
              return;
            }
            if (res.value) stakes.push(res.value);
          });
        }

        return stakes;
      },
      node,
    );
  } catch (error) {
    log("coin-evm/staking", "fetchZeroGravityStakes: delegations fetch failed", {
      currencyId: currency.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

export default zeroGravityValidatorApi;
