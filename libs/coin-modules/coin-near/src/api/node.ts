import { log } from "@ledgerhq/logs";
import network from "@ledgerhq/live-network/network";
import { BigNumber } from "bignumber.js";
import * as nearAPI from "near-api-js";
import { canUnstake, canWithdraw, getYoctoThreshold } from "../logic";
import { getCurrentNearPreloadData } from "../preload";
import { NearAccount } from "../types";
import {
  NearAccessKey,
  NearAccountDetails,
  NearContract,
  NearProtocolConfig,
  NearRawValidator,
  NearStakingPosition,
} from "./sdk.types";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { MIN_ACCOUNT_BALANCE_BUFFER } from "../constants";
import { getCoinConfig } from "../config";

export const fetchAccountDetails = async (address: string): Promise<NearAccountDetails> => {
  const currencyConfig = getCoinConfig();
  const { data } = await network({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "query",
      params: {
        request_type: "view_account",
        finality: "final",
        account_id: address,
      },
    },
  });

  return data.result;
};

export const getAccount = async (
  address: string,
): Promise<Pick<NearAccount, "blockHeight" | "balance" | "spendableBalance" | "nearResources">> => {
  let accountDetails: NearAccountDetails;

  accountDetails = await fetchAccountDetails(address);

  if (!accountDetails) {
    accountDetails = {
      amount: "0",
      block_height: 0,
      storage_usage: 0,
    };
  }

  const { stakingPositions, totalStaked, totalAvailable, totalPending } =
    await getStakingPositions(address);

  const { storageCost } = getCurrentNearPreloadData();

  const balance = new BigNumber(accountDetails.amount);
  const storageUsage = storageCost.multipliedBy(accountDetails.storage_usage);
  const minBalanceBuffer = new BigNumber(MIN_ACCOUNT_BALANCE_BUFFER);

  let spendableBalance = balance.minus(storageUsage).minus(minBalanceBuffer);

  if (spendableBalance.lt(0)) {
    spendableBalance = new BigNumber(0);
  }

  return {
    blockHeight: accountDetails.block_height,
    balance: balance.plus(totalStaked).plus(totalAvailable).plus(totalPending),
    spendableBalance,
    nearResources: {
      stakedBalance: totalStaked,
      availableBalance: totalAvailable,
      pendingBalance: totalPending,
      storageUsageBalance: storageUsage.plus(minBalanceBuffer),
      stakingPositions,
    },
  };
};

export const getProtocolConfig = async (): Promise<NearProtocolConfig> => {
  const currencyConfig = getCoinConfig();
  const { data } = await network({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "EXPERIMENTAL_protocol_config",
      params: {
        finality: "final",
      },
    },
  });

  return data.result;
};

export const getGasPrice = async (): Promise<string> => {
  const currencyConfig = getCoinConfig();
  const { data } = await network({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "gas_price",
      params: [null],
    },
  });

  return data?.result?.gas_price;
};

export const getAccessKey = async ({
  address,
  publicKey,
}: {
  address: string;
  publicKey: string;
}): Promise<NearAccessKey> => {
  const currencyConfig = getCoinConfig();
  const { data } = await network({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "query",
      params: {
        request_type: "view_access_key",
        finality: "final",
        account_id: address,
        public_key: publicKey,
      },
    },
  });

  return data.result || {};
};
/**
 * Implements a retry mechanism for broadcasting a transaction
 * based on the near documentation: https://docs.near.org/api/rpc/transactions#what-could-go-wrong-send-tx
 *
 * `TIMEOUT_ERROR` can be thrown when the transaction is not yet executed in less than 10 seconds.
 * Documentation advises to "re-submit the request with the identical transaction" in this case.
 */
export const broadcastTransaction = async (transaction: string, retries = 6): Promise<string> => {
  const currencyConfig = getCoinConfig();
  const { data } = await network({
    method: "POST",
    url: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    data: {
      jsonrpc: "2.0",
      id: "id",
      method: "send_tx",
      params: {
        signed_tx_base64: transaction,
        wait_until: "EXECUTED_OPTIMISTIC",
      },
    },
  });

  if (data.error) {
    if (data.error?.cause?.name === "TIMEOUT_ERROR" && retries > 0) {
      log("Near", "broadcastTransaction retrying after error", {
        data,
        payload: {
          jsonrpc: "2.0",
          id: "id",
          method: "send_tx",
          params: {
            signed_tx_base64: transaction,
            wait_until: "EXECUTED_OPTIMISTIC",
          },
        },
        retries,
      });
      return broadcastTransaction(transaction, retries - 1);
    }

    log("Near", "broadcastTransaction error", data.error);
    throw new Error((data.error?.cause?.name || "UNKOWWN CAUSE") + ": " + data.error.message);
  }

  return data.result.transaction.hash;
};

export const getStakingPositions = async (
  address: string,
): Promise<{
  stakingPositions: NearStakingPosition[];
  totalStaked: BigNumber;
  totalAvailable: BigNumber;
  totalPending: BigNumber;
}> => {
  const currencyConfig = getCoinConfig();
  const { connect, keyStores } = nearAPI;

  const config = {
    networkId: "mainnet",
    keyStore: new keyStores.InMemoryKeyStore(),
    nodeUrl: currencyConfig.infra.API_NEAR_PRIVATE_NODE,
    headers: {},
  };

  const near = await connect(config);
  const account = await near.account(address);

  let totalStaked = new BigNumber(0);
  let totalAvailable = new BigNumber(0);
  let totalPending = new BigNumber(0);

  const activeDelegatedStakeBalance = await account.getActiveDelegatedStakeBalance();

  const stakingPositions = await Promise.all(
    activeDelegatedStakeBalance.stakedValidators.map(async ({ validatorId }) => {
      const contract = new nearAPI.Contract(account, validatorId, {
        viewMethods: [
          "get_account_staked_balance",
          "get_account_unstaked_balance",
          "is_account_unstaked_balance_available",
        ],
        changeMethods: [],
        useLocalViewExecution: false,
      }) as NearContract;

      const [rawStaked, rawUnstaked, isAvailable] = await Promise.all([
        contract.get_account_staked_balance({
          account_id: address,
        }),
        contract.get_account_unstaked_balance({
          account_id: address,
        }),
        contract.is_account_unstaked_balance_available({
          account_id: address,
        }),
      ]);

      const unstaked = new BigNumber(rawUnstaked);

      let available = new BigNumber(0);
      let pending = unstaked;
      if (isAvailable) {
        available = unstaked;
        pending = new BigNumber(0);
      }

      const staked = new BigNumber(rawStaked);
      available = new BigNumber(available);
      pending = new BigNumber(pending);

      const stakingThreshold = getYoctoThreshold();

      if (staked.gte(stakingThreshold)) {
        totalStaked = totalStaked.plus(staked);
      }
      if (available.gte(stakingThreshold)) {
        totalAvailable = totalAvailable.plus(available);
      }
      if (pending.gte(stakingThreshold)) {
        totalPending = totalPending.plus(pending);
      }

      return {
        staked,
        available,
        pending,
        validatorId,
      };
    }),
  );

  return {
    stakingPositions: stakingPositions.filter(
      sp => canUnstake(sp) || canWithdraw(sp) || sp.pending.gt(0),
    ),
    totalStaked,
    totalAvailable,
    totalPending,
  };
};

export const getValidators = makeLRUCache(
  async (): Promise<NearRawValidator[]> => {
    const currencyConfig = getCoinConfig();
    const { data } = await network({
      method: "POST",
      url: currencyConfig.infra.API_NEAR_PUBLIC_NODE,
      data: {
        jsonrpc: "2.0",
        id: "id",
        method: "validators",
        params: [null],
      },
    });

    return data?.result?.current_validators || [];
  },
  () => "",
  { ttl: 30 * 60 * 1000 },
);

export const getCommission = makeLRUCache(
  async (validatorAddress: string): Promise<number | null> => {
    const currencyConfig = getCoinConfig();
    const { data } = await network({
      method: "POST",
      url: currencyConfig.infra.API_NEAR_PUBLIC_NODE,
      data: {
        jsonrpc: "2.0",
        id: "id",
        method: "query",
        params: {
          request_type: "call_function",
          account_id: validatorAddress,
          method_name: "get_reward_fee_fraction",
          args_base64: "e30=",
          finality: "optimistic",
        },
      },
    });

    const result = data?.result?.result;

    if (Array.isArray(result) && result.length) {
      const parsedResult = JSON.parse(Buffer.from(result).toString());

      return Math.round((parsedResult.numerator / parsedResult.denominator) * 100);
    }

    return null;
  },
  validatorAddress => validatorAddress,
  { ttl: 30 * 60 * 1000 },
);
