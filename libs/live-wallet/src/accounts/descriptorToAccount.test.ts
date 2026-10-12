import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getDerivationModesForCurrency } from "@ledgerhq/ledger-wallet-framework/derivation";
import { listCryptoCurrencies } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { descriptorToAccount } from "./descriptorToAccount";
import { accountDescriptorSchema, type AccountDescriptor } from "./schema";

const toDescriptor = (account: Account): AccountDescriptor => ({
  id: account.id,
  currencyId: account.currency.id,
  freshAddress: account.freshAddress,
  seedIdentifier: account.seedIdentifier,
  derivationMode: account.derivationMode,
  index: account.index,
});

test("descriptorToAccount preserves the descriptor identity for every currency and derivation mode", () => {
  listCryptoCurrencies().forEach(currency => {
    getDerivationModesForCurrency(currency).forEach(derivationMode => {
      const account = genAccount(`${currency.id}_${derivationMode}`, { currency });
      const descriptor = accountDescriptorSchema.parse(toDescriptor(account));
      const restored = descriptorToAccount(descriptor);
      expect(toDescriptor(restored)).toMatchObject(descriptor);
    });
  });
});

// A Zcash account id carries the account's xpub, like a bitcoin one: restoring it as
// a fresh address would derive nothing the account owns.
test.each(["zcash", "zcash_testnet"])(
  "descriptorToAccount restores a %s account's xpub, not a fresh address",
  currencyId => {
    const xpub =
      "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz";
    const restored = descriptorToAccount({
      id: `js:2:${currencyId}:${xpub}:`,
      currencyId,
      freshAddress: "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8",
      seedIdentifier: "seed",
      derivationMode: "",
      index: 0,
    });

    expect(restored.xpub).toBe(xpub);
    expect(restored.freshAddress).toBe("t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8");
  },
);
