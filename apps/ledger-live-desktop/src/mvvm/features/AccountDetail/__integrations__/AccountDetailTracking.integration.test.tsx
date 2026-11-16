import React from "react";
import { Route, Routes } from "react-router";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { getCurrentTrackingPage, setTrackingSource, track, trackPage } from "@shared/analytics";
import { render, screen, within, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
  setTrackingSource: jest.fn(),
  getCurrentTrackingPage: jest.fn(),
}));

// wallet-btc's compiled secp256k1 import does not resolve under Jest.
jest.mock("LLD/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog");

jest.mock("LLD/hooks/useStake", () => ({
  useStake: () => ({
    getCanStakeCurrency: () => false,
    getCanStakeUsingLedgerLive: () => false,
    getRouteToPlatformApp: () => null,
  }),
}));

const mockTrack = jest.mocked(track);
const mockTrackPage = jest.mocked(trackPage);
const mockGetCurrentTrackingPage = jest.mocked(getCurrentTrackingPage);

const ethRoot = genAccount("account-detail-tracking-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 3,
  subAccountsCount: 0,
});
const ethAccount: Account = {
  ...ethRoot,
  subAccounts: [genTokenAccount(0, ethRoot, usdcToken)],
};

const FACTS = { network: "ethereum" };

function renderAccount(account: Account = ethAccount) {
  return render(
    <Routes>
      <Route path="/account/:id/*" element={<AccountDetailRoute />} />
      <Route path="/history" element={null} />
      <Route path="/asset/*" element={null} />
    </Routes>,
    {
      initialRoute: getAccountUrl(account.id),
      initialState: {
        ...withFlagOverrides({
          accountDetail: { enabled: true, params: { analyticsBanner: true } },
        }),
        accounts: [account],
        accountAnalyticsIntroduction: { hasDismissed: false, isEligible: true },
      },
    },
  );
}

const buttonClicks = () =>
  mockTrack.mock.calls.filter(([name]) => name === "button_clicked").map(([, props]) => props);

describe("AccountDetail tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRampCatalog).mockReturnValue({
      isCurrencyAvailable: () => true,
      getSupportedCryptoCurrencyIds: () => [],
    } as unknown as ReturnType<typeof useRampCatalog>);
  });

  describe("page view", () => {
    it("sends Page Account with what the account holds and where the user comes from", async () => {
      mockGetCurrentTrackingPage.mockReturnValue("Asset");

      renderAccount();

      await screen.findByTestId("account-detail-layout");
      expect(mockTrackPage).toHaveBeenCalledWith(
        {
          category: "Account",
          props: {
            ...FACTS,
            source: "Asset",
            operationsCount: ethAccount.operationsCount,
            hasTokens: true,
            hasAnalyticsBanner: true,
          },
        },
        { updateRoutes: true, refreshSource: true },
      );
    });

    it("counts all the operations of the account, not only the loaded ones", async () => {
      renderAccount({ ...ethAccount, operationsCount: ethAccount.operations.length + 200 });

      await screen.findByTestId("account-detail-layout");
      const [{ props }] = mockTrackPage.mock.calls.find(
        ([{ category }]) => category === "Account",
      )!;
      expect(props).toMatchObject({ operationsCount: ethAccount.operations.length + 200 });
    });

    it("leaves the source out when there is no page before", async () => {
      mockGetCurrentTrackingPage.mockReturnValue("");

      renderAccount({ ...ethAccount, subAccounts: [] });

      await screen.findByTestId("account-detail-layout");
      const [{ props }] = mockTrackPage.mock.calls.find(
        ([{ category }]) => category === "Account",
      )!;
      expect(props).toEqual({
        ...FACTS,
        operationsCount: ethAccount.operationsCount,
        hasTokens: false,
        hasAnalyticsBanner: false,
      });
    });
  });

  describe("quick actions", () => {
    it("sends the action with its location on the account page", async () => {
      const { user } = renderAccount();

      await user.click(await screen.findByTestId("account-detail-hero-actions-receive"));

      expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
        ...FACTS,
        button: "receive",
        page: "Account",
        buttonLocation: "quick_action",
      });
    });
  });

  describe("assets", () => {
    it("sends the ticker of the clicked asset and sets the page as its source", async () => {
      const { user } = renderAccount();

      const section = await screen.findByTestId("account-detail-assets");
      await user.click(within(section).getByText("Ethereum"));

      expect(mockTrack).toHaveBeenCalledWith("asset_clicked", {
        ...FACTS,
        asset: "ETH",
        page: "Account",
      });
      expect(setTrackingSource).toHaveBeenCalledWith("Account");
    });
  });

  describe("transactions", () => {
    it("sends the see all click, and no legacy event next to it", async () => {
      const { user } = renderAccount();

      await user.click(await screen.findByTestId("account-detail-transactions-header"));

      expect(buttonClicks()).toEqual([
        { ...FACTS, button: "see all transactions", page: "Account" },
      ]);
    });

    it("sends the type of the clicked transaction", async () => {
      const { user } = renderAccount();

      const section = await screen.findByTestId("account-detail-transactions-section");
      const [row] = within(section).getAllByTestId(/^history-operation-row-/);
      await user.click(row);

      const calls = mockTrack.mock.calls.filter(([name]) => name === "transaction_clicked");
      expect(calls).toHaveLength(1);
      expect(calls[0][1]).toEqual({
        ...FACTS,
        transaction: expect.stringMatching(/^[A-Z_]+$/),
        page: "Account",
      });
    });
  });

  describe("settings", () => {
    const openSettings = async () => {
      const rendered = renderAccount();
      await rendered.user.click(await screen.findByRole("button", { name: "Account settings" }));
      return rendered;
    };

    it("sends the click and the page view when the settings open", async () => {
      await openSettings();

      expect(buttonClicks()).toEqual([{ ...FACTS, button: "account settings", page: "Account" }]);
      expect(mockTrackPage).toHaveBeenCalledWith({
        category: "Account Settings",
        props: { ...FACTS, source: "Account" },
      });
    });

    it("sends each step of the settings on the settings page", async () => {
      const { user } = await openSettings();

      await user.click(await screen.findByTestId("account-settings-change-name"));
      await user.click(screen.getByRole("button", { name: "Go back" }));
      await user.click(screen.getByTestId("account-settings-advanced-logs"));
      await user.click(screen.getByRole("button", { name: "Copy logs" }));

      expect(buttonClicks().slice(1)).toEqual([
        { ...FACTS, button: "edit account name", page: "Account Settings" },
        { ...FACTS, button: "view logs", page: "Account Settings" },
        { ...FACTS, button: "copy logs", page: "Account Settings" },
      ]);
    });

    it("sends the removal steps, the confirmation on its own page", async () => {
      const { user } = await openSettings();

      await user.click(await screen.findByTestId("account-settings-remove-account"));
      await user.click(screen.getByRole("button", { name: "Keep" }));

      expect(buttonClicks().slice(1)).toEqual([
        { ...FACTS, button: "remove from portfolio", page: "Account Settings" },
        { ...FACTS, button: "cancel remove from portfolio", page: "Remove Account" },
      ]);
    });
  });
});
