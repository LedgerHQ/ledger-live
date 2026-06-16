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
      `The account currency must be EVM (family "evm"); received: "${account.currency.family}".`,
    );
  }

  const tokenCurrency = await getCryptoAssetsStore().findTokenById(tokenId);
  if (!tokenCurrency) {
    throw new Error(`No token found for id "${tokenId}".`);
  }

  if (tokenCurrency.parentCurrencyId !== account.currency.id) {
    throw new Error(
      `Token "${tokenId}" is on chain "${tokenCurrency.parentCurrencyId}", but the account currency is "${account.currency.id}"; they must match.`,
    );
  }

  // Ensure EVM coin config is set (e.g. when CLI runs tokenAllowance without having used the bridge)
  createApi(getCurrencyConfiguration<EvmConfigInfo>(account.currency.id), account.currency.id);

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
