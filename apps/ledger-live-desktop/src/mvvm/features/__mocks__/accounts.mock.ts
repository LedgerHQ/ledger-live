import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
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

const xrpTestnetCurrency = getCryptoCurrencyById("ripple_testnet");

const xrpIouToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ripple_testnet/iou/rlusd"),
  parentCurrencyId: xrpTestnetCurrency.id,
  contractAddress: "rIssuer",
  tokenIdentifier: "524C555344000000000000000000000000000000",
  tokenType: "iou",
  name: "RLUSD",
  ticker: "RLUSD",
  units: [{ name: "RLUSD", code: "RLUSD", magnitude: 0 }],
};

export const XRP_ACCOUNT: Account = {
  ...genAccount("xrp-1", { currency: xrpTestnetCurrency }),
  subAccounts: [],
};

const XRP_IOU_TOKEN_ACCOUNT: XrpTokenAccount = {
  ...genTokenAccount(0, XRP_ACCOUNT, xrpIouToken),
  xrpResources: {
    isLocked: false,
    isRippling: false,
    limit: new BigNumber(1000),
  },
};

export const XRP_ACCOUNT_WITH_TOKEN: Account = {
  ...XRP_ACCOUNT,
  subAccounts: [XRP_IOU_TOKEN_ACCOUNT],
};
