import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  arbitrumCurrency,
  baseCurrency,
  bitcoinCurrency,
  ethereumCurrency,
  hederaCurrency,
  scrollCurrency,
  usdcToken,
  solanaCurrency,
} from "./useSelectAssetFlow.mock";

export const ETH_ACCOUNT = genAccount("ethereum-1", {
  currency: ethereumCurrency,
});
export const ETH_ACCOUNT_2 = genAccount("ethereum-2", {
  currency: ethereumCurrency,
});
export const BTC_ACCOUNT = genAccount("bitcoin-1", {
  currency: bitcoinCurrency,
});

export const EMPTY_BTC_ACCOUNT = genAccount("bitcoin-empty", {
  currency: bitcoinCurrency,
  operationsSize: 0,
});

export const ARB_ACCOUNT = genAccount("arbitrum-1", {
  currency: arbitrumCurrency,
  tokenIds: ["arbitrum/erc20/arbitrum"],
});
export const ETH_ACCOUNT_WITH_USDC = genAccount("ethereum-usdc", {
  currency: ethereumCurrency,
  tokensData: [usdcToken],
  tokenIds: [usdcToken.id],
  subAccountsCount: 1,
});
export const BASE_ACCOUNT = genAccount("base-1", {
  currency: baseCurrency,
  operationsSize: 100,
});
export const SCROLL_ACCOUNT = genAccount("scroll-1", {
  currency: scrollCurrency,
  operationsSize: 100,
});
export const HEDERA_ACCOUNT = genAccount("hedera-1", {
  currency: hederaCurrency,
  operationsSize: 100,
});

export const SOL_ACCOUNT = genAccount("solana-1", {
  currency: solanaCurrency,
  operationsSize: 100,
});
