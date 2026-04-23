import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { hederaCurrency } from "./currency.mock";

export const HEDERA_ACCOUNT_1 = {
  ...genAccount("hedera-1", { currency: hederaCurrency }),
  index: 0,
};
