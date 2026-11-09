import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { SendAccountBase, SendTokenAccountBase } from "../registry";

export function createTestAccount(overrides: Partial<SendAccountBase> = {}): SendAccountBase {
  return {
    type: "Account",
    id: "test_account_id",
    currency: getCryptoCurrencyById("bitcoin"),
    freshAddress: "test_fresh_address",
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    pendingOperations: [],
    subAccounts: [],
    ...overrides,
  };
}
