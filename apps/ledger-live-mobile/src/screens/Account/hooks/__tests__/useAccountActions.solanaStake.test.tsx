import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { fromAccountRaw } from "@ledgerhq/ledger-wallet-framework/serialization/account";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  customRenderHookWithLiveAppProvider as renderHook,
  withFlagOverrides,
  withReadOnlyDisabled,
} from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import useAccountActions from "~/screens/Account/hooks/useAccountActions";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useRoute: () => ({ key: "Account", name: "Account" }),
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({}),
}));
jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  useFetchCurrencyAll: () => ({ data: [] }),
}));
jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: () => false }),
}));

const rawSolana: AccountRaw = {
  id: "js:2:solana:HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM:solanaMain",
  seedIdentifier: "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM",
  name: "Solana 1",
  derivationMode: "solanaMain",
  index: 0,
  freshAddress: "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM",
  freshAddressPath: "44'/501'/0'",
  blockHeight: 8168983,
  operations: [],
  pendingOperations: [],
  currencyId: "solana",
  lastSyncDate: "2026-11-17T15:13:30.318Z",
  balance: "5000000000",
};

setCryptoAssetsStore({
  findTokenById: async () => undefined,
  findTokenByAddressInCurrency: async () => undefined,
  getTokensSyncHash: async () => "",
});

let fundedAccount: Account;
let emptyAccount: Account;

beforeAll(async () => {
  fundedAccount = await fromAccountRaw(rawSolana);
  emptyAccount = await fromAccountRaw({ ...rawSolana, balance: "0" });
});

const SOLANA_ON_EARN = {
  platform: "earn",
  name: "Earn",
  queryParams: { intent: "deposit", cryptoAssetId: "solana" },
};

function stakeAction(account: Account, redirects: Record<string, unknown>) {
  const { result } = renderHook(() => useAccountActions({ account }), {
    overrideInitialState: withFlagOverrides(
      {
        stakePrograms: {
          enabled: true,
          params: { list: ["solana"], redirects },
        } as unknown as Parameters<typeof withFlagOverrides>[0]["stakePrograms"],
      },
      (state: State): State => withReadOnlyDisabled(state),
    ),
  });
  return result.current.mainActions.filter(action => action.id === "stake");
}

describe("useAccountActions stake action of a Solana account", () => {
  describe("with the Earn redirect", () => {
    it("shows the Earn action alone, with the native one hidden", () => {
      const actions = stakeAction(fundedAccount, { solana: SOLANA_ON_EARN });

      expect(actions).toHaveLength(1);
      expect(actions[0].eventProperties).toMatchObject({ isRedirectConfig: true, partner: "earn" });
    });

    it("opens the Earn deposit of the account when funds are spendable", () => {
      const [action] = stakeAction(fundedAccount, { solana: SOLANA_ON_EARN });

      expect(action.disabled).toBe(false);
      expect(action.navigationParams?.[0]).toBe(NavigatorName.Base);
      expect(action.navigationParams?.[1]).toMatchObject({
        screen: NavigatorName.Earn,
        params: {
          screen: ScreenName.Earn,
          params: { intent: "deposit", cryptoAssetId: "solana", ledgerAccountId: fundedAccount.id },
        },
      });
    });

    it("stays on screen, disabled, when nothing is spendable: it opens neither Earn nor a No Funds page", () => {
      const [action] = stakeAction(emptyAccount, { solana: SOLANA_ON_EARN });

      expect(action.disabled).toBe(true);
      expect(action.navigationParams?.[1]).toMatchObject({
        navigator: NavigatorName.NoFundsFlow,
        screen: ScreenName.NoFunds,
      });
      expect(JSON.stringify(action.navigationParams)).not.toContain('"intent":"deposit"');
    });
  });

  describe("without the redirect, as on a host that predates it", () => {
    it("keeps the native delegation flow, and its No Funds page when nothing is spendable", () => {
      const [funded] = stakeAction(fundedAccount, {});
      const [empty] = stakeAction(emptyAccount, {});

      expect(funded.eventProperties).not.toHaveProperty("isRedirectConfig");
      expect(funded.navigationParams?.[0]).toBe(NavigatorName.SolanaDelegationFlow);
      expect(empty.navigationParams?.[0]).toBe(NavigatorName.NoFundsFlow);
    });
  });
});
