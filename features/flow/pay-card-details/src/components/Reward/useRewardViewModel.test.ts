import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { useGetCardCashbackQuery } from "@domain/api-card-management";
import { mockPayCardCashback } from "@domain/api-card-management/mock/card-cashback";
import { CARD_CASHBACK_URL, listenToCardApi } from "@support/msw-features-flow-pay-card";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { trackButtonClicked } from "@features/platform-pay-analytics/testing/module-mock";
import { cardApiWrapper } from "../../__tests__/cardApiStore";
import { REWARD_SUBTITLE } from "../../__tests__/i18nWrapper";
import { useRewardViewModel } from "./useRewardViewModel";
import type { RewardProps } from "./types";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

/** The Ledger id the Baanx catalog maps `BTC` to. */
const BTC_LEDGER_ID = "bitcoin";

const BTC = { id: BTC_LEDGER_ID, ticker: "BTC" } as unknown as CryptoOrTokenCurrency;

/** The host's pricing: the currencies it resolved, a rate, and the counter-value formatter. */
function pricing(overrides: Partial<RewardProps> = {}): RewardProps {
  return {
    currencies: new Map([[BTC_LEDGER_ID, BTC]]),
    getCounterValue: () => 1032,
    formatCountervalue: (value: number) => `$${(value / 100).toFixed(2)}`,
    ...overrides,
  };
}

const server = listenToCardApi();

function answerWith(body: JsonBodyType, status = 200) {
  const requests: URL[] = [];

  server.use(
    http.get(CARD_CASHBACK_URL, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(body, { status });
    }),
  );

  return requests;
}

function renderViewModel({ signedIn = true, ...props }: { signedIn?: boolean } & RewardProps = {}) {
  return renderHook(() => useRewardViewModel(props), { wrapper: cardApiWrapper({ signedIn }) });
}

describe("useRewardViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows nothing while the cashback is loading", () => {
    answerWith(mockPayCardCashback());

    const { result } = renderViewModel();

    expect(result.current).toBeNull();
  });

  it("shows the cashback once it arrives, formatted with the given formatter", async () => {
    answerWith(mockPayCardCashback());
    const formatAmount = jest.fn(() => "0.00294697 BTC");

    const { result } = renderViewModel({ formatters: { amount: formatAmount } });

    await waitFor(() => expect(result.current).not.toBeNull());
    // A reward is paid in a token, so the asset's own magnitude applies, not a fiat two.
    expect(formatAmount).toHaveBeenCalledWith("0.00294697", "BTC", "crypto");
    expect(result.current).toEqual({
      amount: "0.00294697 BTC",
      countervalue: null,
      subtitle: REWARD_SUBTITLE,
    });
  });

  it("falls back to a plain amount when no formatter is given", async () => {
    answerWith(mockPayCardCashback());

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({
      amount: "0.00294697 BTC",
      countervalue: null,
      subtitle: REWARD_SUBTITLE,
    });
  });

  it("prices the reward through the host, which is what the banner leads with", async () => {
    answerWith(mockPayCardCashback());

    const { result } = renderViewModel(pricing());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({
      amount: "0.00294697 BTC",
      countervalue: "$10.32",
      subtitle: REWARD_SUBTITLE,
    });
  });

  it("hands the resolved currency and the raw amount to the host's rate", async () => {
    answerWith(mockPayCardCashback());
    const getCounterValue = jest.fn(() => 1032);

    const { result } = renderViewModel(pricing({ getCounterValue }));

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(getCounterValue).toHaveBeenCalledWith(BTC, "0.00294697");
  });

  it.each([
    ["the app has not resolved the currency", pricing({ currencies: new Map() })],
    ["no rate covers the amount", pricing({ getCounterValue: () => null })],
  ])("shows the asset amount alone when %s", async (_name, hostPricing) => {
    answerWith(mockPayCardCashback());

    const { result } = renderViewModel(hostPricing);

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toMatchObject({ countervalue: null, subtitle: REWARD_SUBTITLE });
  });

  it("names the rate and the asset in the subtitle, as the provider sends them", async () => {
    answerWith({ ...mockPayCardCashback(), ratePercent: "2.5" });

    const { result } = renderViewModel(pricing());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toMatchObject({ subtitle: "Total cashback · 2.5% in BTC" });
  });

  it("shows the asset amount alone for an asset the catalog does not map", async () => {
    answerWith({ ...mockPayCardCashback(), currency: "doge" });

    const { result } = renderViewModel(pricing());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toMatchObject({ countervalue: null });
  });

  it.each([
    ["absent", (({ currency: _currency, ...rest }) => rest)(mockPayCardCashback())],
    ["null", { ...mockPayCardCashback(), currency: null }],
  ])("shows nothing when the cashback's currency is %s", async (_name, body) => {
    answerWith(body);

    // The view model answers `null` while loading too, so the read has to have landed first.
    const { result } = renderHook(
      () => ({ viewModel: useRewardViewModel(pricing()), query: useGetCardCashbackQuery() }),
      { wrapper: cardApiWrapper({ signedIn: true }) },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(result.current.viewModel).toBeNull();
  });

  it("shows nothing when the read fails", async () => {
    answerWith({ message: "Internal server error" }, 500);

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current).toBeNull());
  });

  it("asks for nothing while nobody is signed in, so the provider never answers a 401", () => {
    const requests = answerWith(mockPayCardCashback());

    const { result } = renderViewModel({ signedIn: false });

    expect(requests).toEqual([]);
    expect(result.current).toBeNull();
  });

  it("tracks the view-rewards press and hands it to the host", async () => {
    answerWith(mockPayCardCashback());
    const onViewRewards = jest.fn();

    const { result } = renderViewModel({ onViewRewards });

    await waitFor(() => expect(result.current).not.toBeNull());
    act(() => {
      result.current?.onPress?.();
    });

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "view reward currencies",
      page: "Card details",
    });
    expect(onViewRewards).toHaveBeenCalledTimes(1);
  });

  it("leaves the banner without a press handler when the host did not provide one", async () => {
    answerWith(mockPayCardCashback());

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).not.toHaveProperty("onPress");
  });
});
