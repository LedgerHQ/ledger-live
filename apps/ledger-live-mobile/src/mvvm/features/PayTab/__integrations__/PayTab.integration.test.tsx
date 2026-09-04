import React from "react";
import { View } from "react-native";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import { screen, waitFor, within } from "@tests/test-renderer";
import { PAY_CARD_BALANCE_FILTER_ALL } from "@features/flow-pay-balance/state";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { screen as trackScreen } from "~/analytics/segment";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  FEATURE_TOUR_CTA,
  FEATURE_TOUR_ROW,
  holdDada,
  mockFullAssetCatalog,
  payTabEthAccount,
  renderPayTab,
  renderRequestReceive,
  seedContacts,
  selectUsdcOnEthereum,
  setDada,
  usdc,
} from "./shared";

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  track: jest.fn(),
}));

jest.mock("@features/flow-pay-card", () => ({
  Card: () => (
    <>
      <View testID="card-login" />
      <View testID="card-logout" />
    </>
  ),
}));

describe("PayTab integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("feature tour", () => {
    it("should show the feature tour on first visit", async () => {
      renderPayTab({ hasSeenFeatureTour: false });

      expect(screen.getByTestId("paytab-screen")).toBeVisible();
      await waitFor(() => {
        expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
      });
    });

    it("should persist dismissal and hide the tour after pressing Got it", async () => {
      const { user, store } = renderPayTab({ hasSeenFeatureTour: false });

      await waitFor(() => {
        expect(screen.getByText(FEATURE_TOUR_ROW)).toBeVisible();
      });

      await user.press(screen.getByText(FEATURE_TOUR_CTA));

      await waitFor(() => {
        expect(store.getState().payCardFeatureTour.hasSeenFeatureTour).toBe(true);
        expect(screen.queryByText(FEATURE_TOUR_ROW)).toBeNull();
      });
    });

    it("should not show the feature tour once it has been seen", () => {
      renderPayTab();

      expect(screen.getByTestId("paytab-screen")).toBeVisible();
      expect(screen.queryByText(FEATURE_TOUR_ROW)).toBeNull();
    });
  });

  describe("balance", () => {
    it("should render the empty hero when the user holds no stablecoins", async () => {
      renderPayTab();

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.getByText(EMPTY_TITLE)).toBeVisible();
      expect(screen.getByText(EMPTY_DESCRIPTION)).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
      expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
      expect(screen.getByTestId("action-tile-request")).toBeVisible();
    });

    it("should render the aggregated stablecoin balance when the user holds stablecoins", async () => {
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should render the empty hero when the user holds USDC with a zero balance", async () => {
      renderPayTab({ holdsEmptyUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should render the empty hero when accounts hold only crypto", async () => {
      renderPayTab({ cryptoOnly: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should stay empty while DADA hangs if the user holds no stablecoins", async () => {
      setDada("hang");
      renderPayTab({ cryptoOnly: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should stay funded while the catalog hangs if the user holds USDC", async () => {
      setDada("hang");
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should stay empty when DADA fails if the user holds no stablecoins", async () => {
      setDada("error");
      renderPayTab({ cryptoOnly: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should stay funded when DADA fails if the user holds USDC", async () => {
      setDada("error");
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should become funded when DADA resolves a USDC holding", async () => {
      const release = holdDada();
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      release();
      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
    });

    it("should stay empty when DADA resolves with no stablecoin holding", async () => {
      const release = holdDada();
      renderPayTab({ cryptoOnly: true });

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      release();
      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should be funded while DADA hangs if the user holds UNI, then empty when it resolves", async () => {
      const release = holdDada();
      renderPayTab({ holdsUni: true });

      expect(await screen.findByTestId("pay-card-balance-funded-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
      release();
      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
    });

    it("should render Deposit and Request action tiles when the hero is funded", async () => {
      renderPayTab({ holdsUsdc: true });

      expect(await screen.findByTestId("action-tile-deposit")).toBeVisible();
      expect(screen.getByTestId("action-tile-request")).toBeVisible();
      expect(screen.getByText("Add stablecoin")).toBeVisible();
      expect(screen.getByText("Request")).toBeVisible();
    });

    it("should track button_clicked with quick_action location when an action tile is pressed", async () => {
      const { user } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-deposit"));

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "deposit",
        buttonLocation: "quick_action",
        page: "Pay",
      });

      await user.press(screen.getByTestId("action-tile-request"));

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "request",
        buttonLocation: "quick_action",
        page: "Pay",
      });
    });

    it("should track the Pay page with the active balance filter on view", async () => {
      renderPayTab();

      await waitFor(() => {
        const [category, , properties] = jest.mocked(trackScreen).mock.calls[0] ?? [];
        expect(category).toBe("Pay");
        expect(properties).toEqual(expect.objectContaining({ balance_filter: "all" }));
      });
    });

    it("should still render the card login block below the hero", async () => {
      renderPayTab();

      expect(await screen.findByTestId("pay-card-balance-empty-state")).toBeVisible();
      expect(screen.getByTestId("card-login")).toBeVisible();
    });

    it("should open the balance filter bottom sheet from the hero pill and track the interaction", async () => {
      const { user } = renderPayTab({ holdsUsdc: true });

      const pill = await screen.findByTestId("pay-card-balance-filter-pill");
      expect(pill).toBeVisible();

      await user.press(pill);

      expect(await screen.findByTestId("pay-card-balance-filter-picker")).toBeVisible();
      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "balance_filter",
      });
    });

    it("should persist the selected stablecoin, update the hero pill and track the confirmation", async () => {
      const { user, store } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("pay-card-balance-filter-pill"));

      await user.press(await screen.findByTestId("pay-card-balance-filter-option-usdc"));
      await user.press(screen.getByTestId("pay-card-balance-filter-confirm"));

      await waitFor(() => {
        expect(store.getState().payCardBalance.balanceFilter).not.toBe(PAY_CARD_BALANCE_FILTER_ALL);
      });

      const pill = screen.getByTestId("pay-card-balance-filter-pill");
      expect(within(pill).getByText("USDC")).toBeVisible();

      expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
        button: "confirm_balance_filter",
        asset: "USDC",
      });
    });
  });

  describe("deposit options", () => {
    it("opens the deposit options bottom sheet with the four options from the deposit tile", async () => {
      const { user } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-deposit"));

      expect(await screen.findByTestId("pay-card-deposit-options")).toBeVisible();
      expect(screen.getByText("Add stablecoins")).toBeVisible();
      (["bankTransfer", "swap", "receive", "buy"] as const).forEach(id => {
        expect(screen.getByTestId(`pay-card-deposit-option-${id}`)).toBeVisible();
      });
    });

    it("opens the modular asset drawer for the receive flow when the receive option is selected", async () => {
      const { user, store } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-deposit"));
      await user.press(await screen.findByTestId("pay-card-deposit-option-receive"));

      await waitFor(() => {
        expect(store.getState().modularDrawer).toMatchObject({
          isOpen: true,
          flow: "receive_flow",
          source: "Pay",
          categories: [AssetCategory.Stablecoins],
        });
      });
    });

    it("navigates to the Noah fiat provider when the bank transfer option is selected", async () => {
      const { user } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-deposit"));
      await user.press(await screen.findByTestId("pay-card-deposit-option-bankTransfer"));

      expect(await screen.findByTestId("receive-funds-screen")).toHaveTextContent(
        `${ScreenName.ReceiveProvider}:noah`,
      );
    });
  });

  describe("request", () => {
    it("opens the modular asset drawer for the request flow when the request tile is pressed", async () => {
      const { user, store } = renderPayTab({ holdsUsdc: true });

      await user.press(await screen.findByTestId("action-tile-request"));

      await waitFor(() => {
        expect(store.getState().modularDrawer).toMatchObject({
          isOpen: true,
          flow: "request",
          source: "Pay",
          categories: [AssetCategory.Stablecoins],
          enableAccountSelection: true,
        });
      });
    });

    it("should open the request screen after selecting USDC on Ethereum", async () => {
      mockFullAssetCatalog();
      const { user } = renderPayTab({ holdsUsdc: true });

      await selectUsdcOnEthereum(user);

      expect(await screen.findByText("Request USD Coin")).toBeVisible();
      expect(screen.getByTestId("pay-request-receive")).toBeVisible();
      expect(screen.getByTestId("pay-request-receive-qr-code")).toBeVisible();
    });

    it("should render the request receive card for the selected account", async () => {
      renderRequestReceive();

      expect(await screen.findByText("Request USD Coin")).toBeVisible();
      expect(screen.getByTestId("pay-request-receive")).toBeVisible();
      expect(screen.getByTestId("pay-request-receive-summary")).toBeVisible();
      expect(screen.getByText("Share")).toBeVisible();
    });

    it("should share a picture of the request card when Share is pressed", async () => {
      const { user } = renderRequestReceive();

      await user.press(await screen.findByText("Share"));

      await waitFor(() => {
        expect(captureRef).toHaveBeenCalledWith(expect.anything(), { format: "png" });
        expect(Share.open).toHaveBeenCalledWith({
          url: "file://mock.png",
          message: payTabEthAccount.freshAddress,
          failOnCancel: false,
        });
      });
    });

    it("should render an error when the account is missing", () => {
      renderRequestReceive({
        accountId: "missing-account",
        currency: usdc,
      });

      expect(screen.getByTestId("generic-error-modal")).toBeVisible();
      expect(screen.queryByTestId("pay-request-receive-qr-code")).toBeNull();
    });

    it("should show the parent address when the selected token is not yet a sub-account", async () => {
      mockFullAssetCatalog();
      const { user } = renderPayTab({ cryptoOnly: true });

      await selectUsdcOnEthereum(user);

      expect(await screen.findByText("Request USD Coin")).toBeVisible();
      expect(screen.getByTestId("pay-request-receive-qr-code")).toBeVisible();
    });
  });

  describe("contacts strip", () => {
    it("should render the Pay tile without see-all when 8 or fewer contacts are saved", async () => {
      renderPayTab({ contacts: seedContacts(8) });

      expect(await screen.findByTestId("pay-contacts-pay-tile")).toBeVisible();
      expect(screen.getByTestId("pay-contacts-tile-7")).toBeVisible();
      expect(screen.queryByTestId("pay-contacts-tile-8")).toBeNull();
      expect(screen.getByTestId("pay-contacts-see-all").props.onPress).toBeUndefined();
    });

    it("should cap the strip at 8 and open the contacts list with a Pay title via see-all", async () => {
      const { user } = renderPayTab({ contacts: seedContacts(9) });

      expect(await screen.findByTestId("pay-contacts-tile-7")).toBeVisible();
      expect(screen.queryByTestId("pay-contacts-tile-8")).toBeNull();

      await user.press(screen.getByTestId("pay-contacts-see-all"));

      expect(await screen.findByTestId("my-wallet-contacts-screen")).toHaveTextContent(
        `${ScreenName.MyWalletContacts}:Pay contact`,
      );
    });
  });
});
