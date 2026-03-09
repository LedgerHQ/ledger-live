import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getDerivationModesForCurrency } from "@ledgerhq/ledger-wallet-framework/derivation";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/index";
import { setSupportedCurrencies } from "@ledgerhq/ledger-wallet-framework/currencies/index";
import { accountDataToAccount, accountToAccountData } from "./cross";
import { accountUserDataExportSelector, initialState } from "../store";

setSupportedCurrencies(["ethereum", "ethereum_classic"]);

test("accountDataToAccount / accountToAccountData", () => {
  listCryptoCurrencies().forEach(currency => {
    getDerivationModesForCurrency(currency).forEach(derivationMode => {
      const account = genAccount(`${currency.id}_${derivationMode}`, { currency });
      const walletState = initialState;
      const data = accountToAccountData(
        account,
        accountUserDataExportSelector(walletState, { account }),
      );
      expect(accountToAccountData(...accountDataToAccount(data))).toMatchObject(data);
    });
  });
});
