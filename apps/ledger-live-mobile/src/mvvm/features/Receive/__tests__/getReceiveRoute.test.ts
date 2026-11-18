import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  AccountIdSchema,
  LegacyAccountEntrySchema,
  accountsSlice,
  legacyAccountsSynced,
} from "@domain/entity-account";
import { mockAccountEntry } from "@domain/entity-account/schema.mock";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { getReceiveRoute } from "../utils/getReceiveRoute";

jest.mock("~/generated/ReceiveAddressConfig", () => ({
  __esModule: true,
  default: { tron: () => ({ isSupported: false }) },
}));

const entry = LegacyAccountEntrySchema.parse(mockAccountEntry());
const ethereum = getCryptoCurrencyById("ethereum");
const usdc = { type: "TokenCurrency", id: "ethereum/erc20/usd__coin", parentCurrency: ethereum };
const usdcAccount = {
  type: "TokenAccount",
  id: `${entry.legacyId}+ethereum%2Ferc20%2Fusd__coin`,
  parentId: entry.legacyId,
  token: usdc,
} as unknown as TokenAccount;
const ethAccount: Account = {
  ...genAccount("eth", { currency: ethereum }),
  id: entry.legacyId,
  subAccounts: [usdcAccount],
};
const unknownAccount: Account = genAccount("unknown", { currency: ethereum });
const tronAccount: Account = genAccount("tron", { currency: getCryptoCurrencyById("tron") });

function makeState({ enabled = true, excludedFamilies = [] as string[] } = {}) {
  return {
    featureFlags: { resolved: { newReceiveFlow: { enabled, params: { excludedFamilies } } } },
    accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry])),
    accounts: { active: [ethAccount, unknownAccount, tronAccount] },
  } as unknown as State;
}

const legacy = (params: object) => [
  NavigatorName.ReceiveFunds,
  { screen: ScreenName.ReceiveConfirmation, params },
];
const newFlow = (params: object) => [
  NavigatorName.Receive,
  { screen: ScreenName.ReceiveAddress, params },
];

describe("getReceiveRoute", () => {
  it("should open the new receive navigator on an account the account model holds", () => {
    expect(getReceiveRoute({ accountId: ethAccount.id }, makeState())).toEqual(
      newFlow({ accountUUID: entry.accountUUID, assetId: "ethereum" }),
    );
  });

  it("should open the new screen on the token given as currency", () => {
    const params = { accountId: ethAccount.id, currency: usdc } as never;

    expect(getReceiveRoute(params, makeState())).toEqual(
      newFlow({ accountUUID: entry.accountUUID, assetId: usdc.id }),
    );
  });

  it("should open the new screen on the token of a token account id", () => {
    const params = { accountId: usdcAccount.id, parentId: ethAccount.id };

    expect(getReceiveRoute(params, makeState())).toEqual(
      newFlow({ accountUUID: entry.accountUUID, assetId: usdc.id }),
    );
  });

  it("should find the main account of a token account id given without its parent", () => {
    expect(getReceiveRoute({ accountId: usdcAccount.id }, makeState())).toEqual(
      newFlow({ accountUUID: entry.accountUUID, assetId: usdc.id }),
    );
  });

  describe("should keep ReceiveConfirmation, with the same params", () => {
    it("when the flag is off", () => {
      const params = { accountId: ethAccount.id, hideBackButton: true };

      expect(getReceiveRoute(params, makeState({ enabled: false }))).toEqual(legacy(params));
    });

    it("when the entry asks to create the token account", () => {
      const params = {
        accountId: usdcAccount.id,
        parentId: ethAccount.id,
        currency: usdcAccount.token,
        createTokenAccount: true,
      };

      expect(getReceiveRoute(params, makeState())).toEqual(legacy(params));
    });

    it("when the account is unknown to the wallet", () => {
      const params = { accountId: "js:2:ethereum:0xnope:" };

      expect(getReceiveRoute(params, makeState())).toEqual(legacy(params));
    });

    it("when the account model does not hold the account", () => {
      const params = { accountId: unknownAccount.id };

      expect(getReceiveRoute(params, makeState())).toEqual(legacy(params));
    });

    it("when the flag excludes the family", () => {
      const params = { accountId: ethAccount.id };

      expect(getReceiveRoute(params, makeState({ excludedFamilies: ["evm"] }))).toEqual(
        legacy(params),
      );
    });

    it("when the family config does not support the account", () => {
      const tronEntry = LegacyAccountEntrySchema.parse(
        mockAccountEntry({
          descriptor: mockAddressAccountDescriptor({ network: "tron" }),
          legacyId: AccountIdSchema.parse(tronAccount.id),
        }),
      );
      const state = makeState();
      const withTron = {
        ...state,
        accountEntries: accountsSlice.reducer(undefined, legacyAccountsSynced([entry, tronEntry])),
      } as State;
      const params = { accountId: tronAccount.id };

      expect(getReceiveRoute(params, withTron)).toEqual(legacy(params));
    });
  });
});
