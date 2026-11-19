import { legacyAccountsSynced, AccountIdSchema, accountsSlice } from "@domain/entity-account";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { VerifyAddressSelection } from "@features/flow-receive";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";

/** A legacy account of `currencyId`, the selection that verifies its address, and the store state. */
export function verifyFixture(currencyId: string) {
  const account = genAccount(`receive-verify-${currencyId}`, {
    currency: getCryptoCurrencyById(currencyId),
  });
  const descriptor = fromLegacyAccount(account);
  const accountUUID = computeAccountUUID(descriptor);
  const { verification } = mockAccountReceive({ address: account.freshAddress });

  const selection: VerifyAddressSelection = {
    accountUUID,
    assetId: CryptoOrTokenCurrencyIdSchema.parse(currencyId),
    verification: verification!,
  };
  const state = {
    accounts: [account],
    accountEntries: accountsSlice.reducer(
      undefined,
      legacyAccountsSynced([
        { accountUUID, descriptor, legacyId: AccountIdSchema.parse(account.id) },
      ]),
    ),
  };

  return { account, selection, state };
}

export const {
  account: VERIFY_ACCOUNT,
  selection: VERIFY_SELECTION,
  state: VERIFY_ACCOUNT_STATE,
} = verifyFixture("ethereum");
