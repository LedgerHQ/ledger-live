import {
  createFixtureAccount,
  createFixtureTokenAccount,
} from "@ledgerhq/live-common/mock/fixtures/cryptoCurrencies";
import { hederaCurrency, htsToken } from "./currency.mock";

export const HEDERA_ACCOUNT_1 = createFixtureAccount("01", hederaCurrency);

export const HEDERA_ASSOCIATED_SUBACCOUNT = {
  ...createFixtureTokenAccount("01", htsToken),
  parentId: HEDERA_ACCOUNT_1.id,
};
