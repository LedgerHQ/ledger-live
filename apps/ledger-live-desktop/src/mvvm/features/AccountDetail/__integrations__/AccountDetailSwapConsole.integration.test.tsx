import React from "react";
import { BigNumber } from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import Page from "LLD/components/Page";

const mockSwapCatalog: { ids: string[]; isResolved: boolean } = { ids: [], isResolved: true };

jest.mock("@ledgerhq/live-common/exchange/swap/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/exchange/swap/hooks/index"),
  useFetchCurrencyAll: () => ({
    data: mockSwapCatalog.ids,
    isResolved: mockSwapCatalog.isResolved,
  }),
}));

jest.mock("~/renderer/screens/dashboard/components/SwapWebViewEmbedded", () => ({
  __esModule: true,
  default: ({ initialSwapState }: { initialSwapState?: object }) => (
    <div data-testid="swap-webview-embedded">{JSON.stringify(initialSwapState)}</div>
  ),
}));

const SWAP_CONSOLE = "swap-webview-embedded";

const btcAccount: Account = {
  ...genAccount("account-detail-swap-console-btc", {
    currency: getCryptoCurrencyById("bitcoin"),
  }),
  balance: new BigNumber(100000),
  spendableBalance: new BigNumber(100000),
};

function renderAccountPage({ isAccountDetailEnabled = true } = {}) {
  return render(
    <Page>
      <div />
    </Page>,
    {
      initialRoute: getAccountUrl(btcAccount.id),
      initialState: {
        ...withFlagOverrides({
          accountDetail: { enabled: isAccountDetailEnabled },
          ptxSwapLiveAppOnPortfolio: { enabled: true },
        }),
        accounts: [btcAccount],
      },
    },
  );
}

const swapState = () => JSON.parse(screen.getByTestId(SWAP_CONSOLE).textContent ?? "{}");

describe("AccountDetail swap console", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
  });

  beforeEach(() => {
    mockSwapCatalog.ids = ["bitcoin"];
    mockSwapCatalog.isResolved = true;
  });

  it("shows the swap console prefilled with the account and its currency", async () => {
    renderAccountPage();

    expect(await screen.findByTestId(SWAP_CONSOLE)).toBeInTheDocument();
    expect(swapState()).toEqual(
      expect.objectContaining({
        defaultAccountId: btcAccount.id,
        defaultCurrency: { toCurrencyId: "bitcoin" },
      }),
    );
  });

  it("hides the swap console when the account detail flag is off", () => {
    renderAccountPage({ isAccountDetailEnabled: false });

    expect(screen.queryByTestId(SWAP_CONSOLE)).toBeNull();
  });

  it("hides the swap console once the catalog resolves without any asset of the account", () => {
    mockSwapCatalog.ids = ["ethereum"];

    renderAccountPage();

    expect(screen.queryByTestId(SWAP_CONSOLE)).toBeNull();
  });

  it("keeps the swap console while the catalog is not resolved yet", async () => {
    mockSwapCatalog.ids = [];
    mockSwapCatalog.isResolved = false;

    renderAccountPage();

    expect(await screen.findByTestId(SWAP_CONSOLE)).toBeInTheDocument();
  });
});
