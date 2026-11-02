import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { render, screen } from "@tests/test-renderer";
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

const DRAWER_DESCRIPTION =
  "Your portfolio performance broken down into estimated unrealised and realised return.";
const DISCLAIMER =
  "This data is provided for informational purposes only and is not financial advice. Not to be used for tax purposes.";

describe("PnlSection integration", () => {
  describe("visibility", () => {
    it("renders the title, both return cards and the detail drawer copy when there are accounts", () => {
      render(<PnlSection />, { overrideInitialState: withAccounts });

      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.root)).toBeVisible();
      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.title)).toBeVisible();
      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.unrealisedCard)).toBeVisible();
      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.realisedCard)).toBeVisible();
      // The detail drawer copy is wired through the view model.
      expect(screen.getByText(DRAWER_DESCRIPTION)).toBeVisible();
      expect(screen.getByText("Total return")).toBeVisible();
      expect(screen.getByText(DISCLAIMER)).toBeVisible();
    });

    it("renders nothing when there are no accounts", () => {
      render(<PnlSection />);

      expect(screen.queryByTestId(PNL_SECTION_TEST_IDS.root)).toBeNull();
    });
  });

  describe("drawer opening", () => {
    it("keeps the section mounted when the title is pressed to open the detail drawer", async () => {
      const { user } = render(<PnlSection />, { overrideInitialState: withAccounts });

      await user.press(screen.getByTestId(PNL_SECTION_TEST_IDS.title));

      expect(screen.getByTestId(PNL_SECTION_TEST_IDS.root)).toBeVisible();
    });
  });
});
