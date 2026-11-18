import {
  AccountIdSchema,
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { resolveReceiveRoute } from "../resolveReceiveRoute";

const entry = LegacyAccountEntrySchema.parse(mockAccountEntry());
const accounts = accountsSlice.reducer(undefined, legacyAccountsSynced([entry]));
const ETH = {
  id: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  type: "CryptoCurrency" as const,
};
const on = { enabled: true, params: { excludedFamilies: [] } };

const input = {
  flag: on,
  accounts,
  legacyAccountId: entry.legacyId,
  asset: ETH,
  family: "evm",
  familyConfig: undefined,
  featureFlags: {},
  legacyAccount: { id: entry.legacyId },
};

describe("resolveReceiveRoute", () => {
  it("should open the new flow on the account and the asset when the account model holds it", () => {
    expect(resolveReceiveRoute(input)).toEqual({
      accountUUID: entry.accountUUID,
      descriptor: entry.descriptor,
      assetId: "ethereum",
    });
  });

  it.each([
    ["the flag is off", { flag: { enabled: false } }],
    ["the flag is missing", { flag: undefined }],
    [
      "the account model does not hold the account",
      { legacyAccountId: AccountIdSchema.parse("js:2:ethereum:0xunknown:") },
    ],
    [
      "the flag excludes the family",
      { flag: { enabled: true, params: { excludedFamilies: ["evm"] } } },
    ],
    ["the family config does not support it", { familyConfig: () => ({ isSupported: false }) }],
  ])("should keep the legacy flow when %s", (_case, overrides) => {
    expect(resolveReceiveRoute({ ...input, ...overrides })).toBeUndefined();
  });

  it("should give the family config the account's descriptor and the legacy account", () => {
    const familyConfig = jest.fn(() => ({}));

    resolveReceiveRoute({ ...input, familyConfig });

    expect(familyConfig).toHaveBeenCalledWith({
      descriptor: entry.descriptor,
      asset: ETH,
      featureFlags: {},
      legacyAccount: input.legacyAccount,
    });
  });
});
