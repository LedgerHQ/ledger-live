import React from "react";
import type { ReactNode } from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { liveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useInvestActions } from "LLD/features/AccountDetail/components/Hero/useInvestActions";
import type { AccountAsset } from "LLD/features/AccountDetail/components/Hero/types";
import useStakeFlow from "~/renderer/screens/stake";
import { useNavigateToStakeForAccount } from "../useNavigateToStakeForAccount";

const mockNavigate = jest.fn();
let mockPickedAccount: AccountLike | undefined;

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetAndAccount", () => ({
  useOpenAssetAndAccount: () => ({
    openAssetAndAccount: ({ onSuccess }: { onSuccess: (account: AccountLike) => void }) => {
      if (mockPickedAccount) onSuccess(mockPickedAccount);
    },
  }),
}));

const earnManifest: LiveAppManifest = {
  id: "earn",
  name: "Earn",
  url: "https://earn.example",
  homepageUrl: "https://earn.example",
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  platforms: ["desktop"],
  domains: ["https://*"],
  visibility: "complete",
  categories: ["earn"],
  currencies: "*",
  permissions: ["account.list"],
  content: { shortDescription: { en: "Earn" }, description: { en: "Earn" } },
};

const EarnProvider = ({ children }: { children: ReactNode }) => (
  <liveAppContext.Provider
    value={{
      state: [earnManifest],
      addLocalManifest: jest.fn(),
      removeLocalManifestById: jest.fn(),
      getLocalLiveAppManifestById: id => (id === earnManifest.id ? earnManifest : undefined),
    }}
  >
    {children}
  </liveAppContext.Provider>
);

const solana = getCryptoCurrencyById("solana");

function solanaAccount(spendableLamports: number): Account {
  return {
    ...genAccount("solana-redirect", { currency: solana, operationsSize: 0, subAccountsCount: 0 }),
    balance: new BigNumber(spendableLamports),
    spendableBalance: new BigNumber(spendableLamports),
  };
}

const SOLANA_ON_EARN = {
  platform: "earn",
  name: "Earn",
  queryParams: { intent: "deposit", cryptoAssetId: "solana" },
};

/** The `stakePrograms` flag of a host that has the Solana redirect, or of one that predates it. */
function stakePrograms(redirects: Record<string, unknown>) {
  return withFlagOverrides({
    stakePrograms: {
      enabled: true,
      params: { list: ["solana"], redirects },
    } as unknown as Parameters<typeof withFlagOverrides>[0]["stakePrograms"],
  });
}

const withRedirect = stakePrograms({ solana: SOLANA_ON_EARN });
const withoutRedirect = stakePrograms({});

function renderNavigation(initialState: ReturnType<typeof withFlagOverrides>) {
  return renderHook(() => useNavigateToStakeForAccount(), {
    initialState,
    wrapper: EarnProvider,
  });
}

/** Presses the Earn action of the account page, with the account as the only Earn asset. */
function pressEarn(account: Account) {
  const asset: AccountAsset = { currency: solana, account, parentAccount: undefined };
  const pickAsset = jest.fn(
    (assets: readonly AccountAsset[], onPicked: (a: AccountAsset) => void) => onPicked(assets[0]),
  );
  const { result, store } = renderHook(
    () =>
      useInvestActions({
        account,
        byAction: { buy: [], sell: [], swap: [], earn: [asset] },
        pickAsset,
      }),
    { initialState: withRedirect, wrapper: EarnProvider },
  );
  act(() => result.current("earn"));
  return { store };
}

/** Presses the Earn banner of the asset page, and picks the account in the dialog that follows. */
function pickAccountOnAssetPage(account: Account) {
  mockPickedAccount = account;
  const { result, store } = renderHook(() => useStakeFlow(), {
    initialState: withRedirect,
    wrapper: EarnProvider,
  });
  act(() => result.current({ currencies: ["solana"], source: "Asset Detail" }));
  return { store };
}

describe("a Solana account and the Earn redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickedAccount = undefined;
  });

  describe("navigateToStakeForAccount", () => {
    it("opens the Earn deposit of the account when funds are spendable", () => {
      const { result, store } = renderNavigation(withRedirect);
      const account = solanaAccount(5_000_000_000);

      let outcome: ReturnType<typeof result.current.navigateToStakeForAccount> | undefined;
      act(() => {
        outcome = result.current.navigateToStakeForAccount(account, undefined, {
          source: "Account",
        });
      });

      expect(outcome).toEqual({ outcome: "platform_earn", provider: "earn" });
      expect(mockNavigate).toHaveBeenCalledWith("/earn", {
        state: expect.objectContaining({
          appId: "earn",
          intent: "deposit",
          cryptoAssetId: "solana",
          accountId: expect.any(String),
          walletAccountId: expect.any(String),
        }),
      });
      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBeFalsy();
    });

    it("opens the No Funds modal, and no redirect, when nothing is spendable", () => {
      const { result, store } = renderNavigation(withRedirect);

      let outcome: ReturnType<typeof result.current.navigateToStakeForAccount> | undefined;
      act(() => {
        outcome = result.current.navigateToStakeForAccount(solanaAccount(0), undefined);
      });

      expect(outcome).toEqual({ outcome: "no_funds" });
      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("starts the native delegation of an account with funds, on a host that has no redirect", () => {
      const { result, store } = renderNavigation(withoutRedirect);

      let outcome: ReturnType<typeof result.current.navigateToStakeForAccount> | undefined;
      act(() => {
        outcome = result.current.navigateToStakeForAccount(solanaAccount(5_000_000_000), undefined);
      });

      expect(outcome).toEqual({ outcome: "native_stake" });
      expect(store.getState().modals.MODAL_START_STAKE?.isOpened).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("opens the No Funds modal on a host that has no redirect either", () => {
      const { result, store } = renderNavigation(withoutRedirect);

      act(() => {
        result.current.navigateToStakeForAccount(solanaAccount(0), undefined);
      });

      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("the Earn button of the new account page", () => {
    it("opens the Earn deposit when funds are spendable", () => {
      pressEarn(solanaAccount(5_000_000_000));

      expect(mockNavigate).toHaveBeenCalledWith(
        "/earn",
        expect.objectContaining({ state: expect.objectContaining({ cryptoAssetId: "solana" }) }),
      );
    });

    it("opens the No Funds modal when nothing is spendable", () => {
      const { store } = pressEarn(solanaAccount(0));

      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("the Earn banner of the asset page", () => {
    it("opens the Earn deposit of the account picked, when funds are spendable", () => {
      pickAccountOnAssetPage(solanaAccount(5_000_000_000));

      expect(mockNavigate).toHaveBeenCalledWith(
        "/earn",
        expect.objectContaining({ state: expect.objectContaining({ cryptoAssetId: "solana" }) }),
      );
    });

    it("opens the No Funds modal for an account picked with nothing spendable", () => {
      const { store } = pickAccountOnAssetPage(solanaAccount(0));

      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBe(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
