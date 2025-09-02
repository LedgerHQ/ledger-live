import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Cursor, Page, Stake } from "@ledgerhq/coin-framework/api/types";
import { withApi } from "../network/node/rpc.common";
import { getAllStakingContracts } from "../staking/config";
import { encodeStakingData, decodeStakingResult } from "../staking/encoder";
import type { StakeCreate } from "../types/staking";

const createStakeFromContract = async (stakingContract: StakeCreate): Promise<Stake | null> => {
  const { currency, config, address, currencyId, validatorAddress } = stakingContract;

  return withApi(currency, async api => {
    try {
      const encodedData = encodeStakingData({
        currencyId,
        operation: "getStakedBalance",
        config,
        params: [address],
      });

      const result = await api.call({
        to: config.contractAddress,
        data: encodedData,
      });

      const decoded = decodeStakingResult(currencyId, "getStakedBalance", config, result);

      const amount = BigInt(decoded[0].toString());

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
      console.warn(`Failed to fetch stake from currency ${currencyId}:`, error);
      return null;
    }
  });
};

export const getStakes = async (
  currency: CryptoCurrency,
  address: string,
  _cursor?: Cursor,
): Promise<Page<Stake>> => {
  const allStakingContracts = getAllStakingContracts();
  const stakes: Stake[] = [];

  for (const [currencyId, config] of Object.entries(allStakingContracts)) {
    const stake = await createStakeFromContract({
      address,
      config,
      currencyId,
      currency,
      validatorAddress: config.contractAddress,
    });

    if (stake) {
      stakes.push(stake);
    }
  }

  return { items: stakes };
};
