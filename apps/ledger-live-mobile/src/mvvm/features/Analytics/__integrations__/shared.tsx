import React from "react";
import Navigator from "../Navigator";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export const TestNavigatorWrapper: React.FC = () => {
  return <Navigator />;
};

export const mockBitcoinCurrency = getCryptoCurrencyById("bitcoin");
export const mockEthereumCurrency = getCryptoCurrencyById("ethereum");
export const mockCardanoCurrency = getCryptoCurrencyById("cardano");

export { usdcToken };

export const createMockAccount = (currency: CryptoCurrency, id: string): Account => {
  return genAccount(id, { currency, operationsSize: 0 });
};

export const createMockEthAccountWithUSDC = (): Account =>
  genAccount("eth-usdc", {
    currency: mockEthereumCurrency,
    operationsSize: 0,
    tokenIds: [usdcToken.id],
  });
