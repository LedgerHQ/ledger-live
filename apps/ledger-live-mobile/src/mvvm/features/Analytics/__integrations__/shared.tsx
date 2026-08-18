import React from "react";
import Navigator from "../Navigator";
import { type CryptoCurrency, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account } from "@ledgerhq/types-live";

export { usdcToken };

export const TestNavigatorWrapper: React.FC = () => {
  return <Navigator />;
};

export const mockBitcoinCurrency = getCryptoCurrencyById("bitcoin");
export const mockEthereumCurrency = getCryptoCurrencyById("ethereum");
export const mockCardanoCurrency = getCryptoCurrencyById("cardano");

export const createMockAccount = (currency: CryptoCurrency, id: string): Account => {
  return genAccount(id, { currency, operationsSize: 0 });
};
