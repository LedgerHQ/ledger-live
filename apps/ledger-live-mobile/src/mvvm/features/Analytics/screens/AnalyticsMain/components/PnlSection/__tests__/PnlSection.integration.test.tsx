import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import PnlSection, { PNL_SECTION_TEST_IDS } from "..";

const btcAccount = genAccount("btc-1", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const withAccounts = (state: State): State => ({
  ...state,
  accounts: { ...state.accounts, active: [btcAccount] },
});

const compose =
  (...transforms: Array<(state: State) => State>) =>
  (state: State): State =>
    transforms.reduce((acc, t) => t(acc), state);

const withPnl = (enabled: boolean) =>
  compose(
    withAccounts,
    withFlagOverrides({ lwmWallet40: { enabled: true, params: { pnl: enabled } } }),
  );

const DRAWER_DESCRIPTION =
  "Your portfolio performance broken down into estimated unrealised and realised return.";
const DISCLAIMER =
  "This data is provided for informational purposes only and is not financial advice. Not to be used for tax purposes.";

describe("PnlSection integration", () => {
  describe("feature flag gating", () => {
    it("renders the title, both return cards and the detail drawer copy when shouldDisplayPnl is true and there are accounts", () => {
      render(<PnlSection />, { overrideInitialState: withPnl(true) });

      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.root)).toBeVisible();
      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.title)).toBeVisible();
      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.unrealisedCard)).toBeVisible();
      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.realisedCard)).toBeVisible();
      // The detail drawer copy is wired through the view model.
      expect(screen.getByText(DRAWER_DESCRIPTION)).toBeVisible();
      expect(screen.getByText("Total return")).toBeVisible();
      expect(screen.getByText(DISCLAIMER)).toBeVisible();
    });

    it("renders nothing when shouldDisplayPnl is false", () => {
      render(<PnlSection />, { overrideInitialState: withPnl(false) });

      expect(screen.queryByTestId(PNL_SECTION_TEST_IDS.root)).toBeNull();
    });

    it("renders nothing when there are no accounts", () => {
      render(<PnlSection />, {
        overrideInitialState: withFlagOverrides({
          lwmWallet40: { enabled: true, params: { pnl: true } },
        }),
      });

      expect(screen.queryByTestId(PNL_SECTION_TEST_IDS.root)).toBeNull();
    });
  });

  describe("drawer opening", () => {
    it("keeps the section mounted when the title is pressed to open the detail drawer", async () => {
      const { user } = render(<PnlSection />, { overrideInitialState: withPnl(true) });

      await user.press(screen.getByTestId(PNL_SECTION_TEST_IDS.title));

      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.root)).toBeVisible();
    });
  });
});
