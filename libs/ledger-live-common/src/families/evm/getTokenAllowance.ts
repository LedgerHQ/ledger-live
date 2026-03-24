import type { Account } from "@ledgerhq/types-live";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { createApi } from "@ledgerhq/coin-evm/api/index";
import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { getCurrencyConfiguration } from "../../config";
import BigNumber from "bignumber.js";

export type GetEvmTokenAllowanceResult = {
  allowance: BigNumber;
  unit: Unit;
  symbol: string;
  tokenId: string;
  owner: string;
  spender: string;
  contractAddress: string;
};

/**
 * Get the ERC-20 allowance that an owner has granted to a spender for a given token.
 * Only valid for EVM main accounts; token must be on the same chain as the account.
 *
 * @param account - EVM main account (owner address is account.freshAddress)
 * @param tokenId - Token id e.g. ethereum/erc20/usd_tether__erc20_ for USDT
 * @param spender - Spender address (e.g. router or protocol)
 * @returns Allowance in token units and metadata, or throws if token not found / not EVM
 */
export async function getEvmTokenAllowance(
  account: Account,
  tokenId: string,
  spender: string,
): Promise<GetEvmTokenAllowanceResult> {
  if (account.currency.family !== "evm") {
    throw new Error(
      `getEvmTokenAllowance requires an EVM account; got ${account.currency.family}. Use --currency with an EVM chain (e.g. ethereum, polygon).`,
    );
  }

  const tokenCurrency = await getCryptoAssetsStore().findTokenById(tokenId);
  if (!tokenCurrency) {
    throw new Error(
      `Token "${tokenId}" not found. Use a token id (e.g. ethereum/erc20/usd__coin for USDC, ethereum/erc20/usd_tether__erc20_ for USDT).`,
    );
  }

  if (tokenCurrency.parentCurrency.id !== account.currency.id) {
    throw new Error(
      `Token ${tokenId} is not on ${account.currency.id}. Use a token for the account's chain.`,
    );
  }

  // Ensure EVM coin config is set (e.g. when CLI runs tokenAllowance without having used the bridge)
  createApi(
    getCurrencyConfiguration<EvmConfigInfo>(account.currency),
    account.currency.id,
  );

  const nodeApi = getNodeApi(account.currency);
  const allowance = await nodeApi.getTokenAllowance(
    account.currency,
    account.freshAddress,
    tokenCurrency.contractAddress,
    spender,
  );

  return {
    allowance,
    unit: tokenCurrency.units[0],
    symbol: tokenCurrency.ticker,
    tokenId,
    owner: account.freshAddress,
    spender,
    contractAddress: tokenCurrency.contractAddress,
  };
}
