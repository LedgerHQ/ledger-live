import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { resetTrackingPages, trackPage } from "@shared/analytics";
import { renderHook } from "tests/testSetup";
import { useAccountPageTracking } from "../useAccountPageTracking";

jest.mock("@shared/analytics", () => {
  const actual = jest.requireActual("@shared/analytics");
  return { ...actual, trackPage: jest.fn(actual.trackPage) };
});

const mockTrackPage = jest.mocked(trackPage);

const btcAccount = genAccount("page-tracking-btc", {
  currency: getCryptoCurrencyById("bitcoin"),
});

const accountPageProps = () => {
  const [{ props }] = mockTrackPage.mock.calls.find(([{ category }]) => category === "Account")!;
  return props;
};

describe("useAccountPageTracking", () => {
  beforeEach(() => {
    resetTrackingPages();
    mockTrackPage.mockClear();
  });

  it("reports the page the user comes from after Portfolio → Asset → Account", () => {
    const routes = { updateRoutes: true, refreshSource: true };
    trackPage({ category: "Portfolio" }, routes);
    trackPage({ category: "Asset" }, routes);
    mockTrackPage.mockClear();

    renderHook(() => useAccountPageTracking(btcAccount));

    expect(accountPageProps()).toMatchObject({ source: "Asset" });
  });

  it("leaves the source out on a first page", () => {
    renderHook(() => useAccountPageTracking(btcAccount));

    expect(accountPageProps()).not.toHaveProperty("source");
  });
});
