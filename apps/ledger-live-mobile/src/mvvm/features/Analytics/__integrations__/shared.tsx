import React from "react";
import Navigator from "../Navigator";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
export { usdcToken };
import {
  createFixtureAccount,
  createFixtureTokenAccount,
} from "@ledgerhq/live-common/mock/fixtures/cryptoCurrencies";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const TestNavigatorWrapper: React.FC = () => {
  return <Navigator />;
};

export const mockBitcoinCurrency = getCryptoCurrencyById("bitcoin");
export const mockEthereumCurrency = getCryptoCurrencyById("ethereum");
export const mockCardanoCurrency = getCryptoCurrencyById("cardano");

// ETH_ACCOUNT_WITH_USDC from accounts.mock.ts is not used here, the USDC token may not appear depending on the seed.
// Fixture helpers always produce a TokenAccount with a non-zero balance.
// Using ETH_ACCOUNT_WITH_USDC fails the test about blacklisted tokens.
const usdcSubAccount = createFixtureTokenAccount("01", usdcToken);
const ethAccount = createFixtureAccount("01", mockEthereumCurrency);
export const mockEthAccountWithUSDC: Account = {
  ...ethAccount,
  subAccounts: [{ ...usdcSubAccount, parentId: ethAccount.id }],
};

export const createMockAccount = (currency: CryptoCurrency, id: string): Account => {
  return genAccount(id, { currency, operationsSize: 0 });
};
