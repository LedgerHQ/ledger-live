import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Unit } from "@domain/entity-currency-unit";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { createApi } from "@ledgerhq/coin-evm/api";
import { getNodeApi } from "@ledgerhq/coin-evm/network";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { requireExtension } from "@ledgerhq/portfolio-module-framework";
import { ethers } from "ethers";
import { buildContext } from "../../bridge/generic-coin-framework/api/context";
import { openCurrencyPortfolio } from "../../bridge/generic-coin-framework/networkPortfolio";
import { isPortfolioEnabledFor } from "../../bridge/generic-coin-framework/portfolio/config";
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

const ERC20_ALLOWANCE = new ethers.Interface([
  "function allowance(address owner, address spender) view returns (uint256)",
]);

/**
 * The allowance through the portfolio layer: the network's read-only call (`eth_call`) of the
 * token's `allowance(owner, spender)`, decoded.
 */
async function portfolioTokenAllowance(
  currency: CryptoCurrency,
  { owner, contractAddress, spender }: { owner: string; contractAddress: string; spender: string },
): Promise<BigNumber> {
  const { portfolio, network } = await openCurrencyPortfolio(currency, "read");
  const { result } = await requireExtension(portfolio, "call")(network, {
    params: {
      to: contractAddress,
      data: ERC20_ALLOWANCE.encodeFunctionData("allowance", [
        ethers.getAddress(owner),
        ethers.getAddress(spender),
      ]),
    },
  });
  const [allowance] = ERC20_ALLOWANCE.decodeFunctionResult("allowance", result as string);
  return new BigNumber(allowance.toString());
}

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

  let allowance: BigNumber;
  if (isPortfolioEnabledFor(account.currency.id)) {
    allowance = await portfolioTokenAllowance(account.currency, {
      owner: account.freshAddress,
      contractAddress: tokenCurrency.contractAddress,
      spender,
    });
  } else {
    // Ensure EVM coin config is set (e.g. when CLI runs tokenAllowance without having used the bridge)
    createApi(account.currency.id);
    const evmCtx = buildContext<EvmConfigInfo>(account.currency.id);
    const config = await evmCtx.config();
    const nodeApi = getNodeApi(config, evmCtx.logger);
    allowance = await nodeApi.getTokenAllowance(
      account.freshAddress,
      tokenCurrency.contractAddress,
      spender,
    );
  }

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
