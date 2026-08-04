import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getDerivationModesForCurrency } from "@ledgerhq/ledger-wallet-framework/derivation";
import { listCryptoCurrencies } from "@domain/entity-currency-crypto";
import { accountDataToAccount, accountToAccountData } from "./cross";
import { getDefaultAccountName } from "@domain/entity-account-name";

test("accountDataToAccount / accountToAccountData", () => {
  listCryptoCurrencies().forEach(currency => {
    getDerivationModesForCurrency(currency).forEach(derivationMode => {
      const account = genAccount(`${currency.id}_${derivationMode}`, { currency });
      const accountUserData = {
        id: account.id,
        name: getDefaultAccountName(account),
        starredIds: [],
      };
      const data = accountToAccountData(account, accountUserData);
      expect(accountToAccountData(...accountDataToAccount(data))).toMatchObject(data);
    });
  });
});
