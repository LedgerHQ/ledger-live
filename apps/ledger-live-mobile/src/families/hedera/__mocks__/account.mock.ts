import {
  createFixtureAccount,
  createFixtureTokenAccount,
} from "@ledgerhq/live-common/mock/fixtures/cryptoCurrencies";
import type { HederaAccount, HederaResources } from "@ledgerhq/live-common/families/hedera/types";
import { hederaCurrency, htsToken } from "./currency.mock";

export const HEDERA_ACCOUNT_1 = createFixtureAccount("01", hederaCurrency);

export const HEDERA_ASSOCIATED_SUBACCOUNT = {
  ...createFixtureTokenAccount("01", htsToken),
  parentId: HEDERA_ACCOUNT_1.id,
};

export const baseResources: HederaResources = {
  maxAutomaticTokenAssociations: 0,
  isAutoTokenAssociationEnabled: false,
  delegation: null,
};

export const makeHederaAccount = (resourceOverrides?: Partial<HederaResources>): HederaAccount =>
  ({
    ...HEDERA_ACCOUNT_1,
    hederaResources: { ...baseResources, ...resourceOverrides },
  }) as HederaAccount;

export const overrideWithHederaAccount1 = <S extends { accounts: { active: unknown[] } }>(
  state: S,
): S => ({
  ...state,
  accounts: { ...state.accounts, active: [HEDERA_ACCOUNT_1] },
});
