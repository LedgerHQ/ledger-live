import { legacyAccountsSynced, AccountIdSchema, accountsSlice } from "@domain/entity-account";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { VerifyAddressSelection } from "@features/flow-receive";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";

export const VERIFY_ACCOUNT = genAccount("receive-verify-address", {
  currency: getCryptoCurrencyById("ethereum"),
});

const accountUUID = computeAccountUUID(fromLegacyAccount(VERIFY_ACCOUNT));

export const { verification: VERIFY_VERIFICATION } = mockAccountReceive({
  address: VERIFY_ACCOUNT.freshAddress,
});

export const VERIFY_SELECTION: VerifyAddressSelection = {
  accountUUID,
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  verification: VERIFY_VERIFICATION!,
};

/** The legacy account and the entry that maps its `AccountUUID` to it. */
export const VERIFY_ACCOUNT_STATE = {
  accounts: [VERIFY_ACCOUNT],
  accountEntries: accountsSlice.reducer(
    undefined,
    legacyAccountsSynced([
      {
        accountUUID,
        descriptor: fromLegacyAccount(VERIFY_ACCOUNT),
        legacyId: AccountIdSchema.parse(VERIFY_ACCOUNT.id),
      },
    ]),
  ),
};
