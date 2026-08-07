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
