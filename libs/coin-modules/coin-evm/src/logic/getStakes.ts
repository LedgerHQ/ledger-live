import { ethers } from "ethers";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Cursor, Page, Stake } from "@ledgerhq/coin-framework/api/types";
import { withApi } from "../network/node/rpc.common";
import { getAllStakingContracts } from "../staking/config";
import type { StakingContractConfig } from "../types/staking";

const createStakeFromContract = async (
  currency: CryptoCurrency,
  address: string,
  contractAddress: string,
  validatorAddress: string,
  config: StakingContractConfig,
): Promise<Stake | null> => {
  return withApi(currency, async api => {
    try {
      // TODO: check if this is the right return type (uint256), idk really how this works actually 🤔
      const iface = new ethers.utils.Interface([
        `function ${config.getStakedBalance}(address) view returns (uint256)`,
      ]);
      const encodedData = iface.encodeFunctionData(config.getStakedBalance, [address]);

      const result = await api.call({
        to: contractAddress,
        data: encodedData,
      });

      // Decode the result (if this is REALLY uint256?)
      const decoded = iface.decodeFunctionResult(config.getStakedBalance, result);
      const amount = BigInt(decoded[0].toString());

      if (amount === 0n) {
        return null;
      }

      return {
        uid: `${contractAddress}-${validatorAddress}-${address}`,
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
          contractAddress,
          validator: validatorAddress,
        },
      };
    } catch (error) {
      console.warn(`Failed to fetch stake from contract ${contractAddress}:`, error);
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

  for (const [contractAddress, config] of Object.entries(allStakingContracts)) {
    const stake = await createStakeFromContract(
      currency,
      address,
      contractAddress,
      contractAddress, // Using contract as validator atm (?)
      config,
    );

    if (stake) {
      stakes.push(stake);
    }
  }

  return { items: stakes };
};
