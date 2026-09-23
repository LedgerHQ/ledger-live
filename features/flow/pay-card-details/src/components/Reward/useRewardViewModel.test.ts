import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { mockPayCardRewardWallet } from "@domain/api-card-management/mock/card-wallets";
import { CARD_REWARD_WALLET_URL, listenToCardApi } from "@support/msw-features-flow-pay-card";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { cardApiWrapper } from "../../__tests__/cardApiStore";
import { CARD_COPY } from "../../__tests__/i18nWrapper";
import { useRewardViewModel } from "./useRewardViewModel";
import type { RewardProps } from "./types";

/** The Ledger id the Baanx catalog maps `usdc` to, whichever form of the pair names it. */
const USDC_LEDGER_ID = "ethereum/erc20/usd__coin";

const USDC = { id: USDC_LEDGER_ID, ticker: "USDC" } as unknown as CryptoOrTokenCurrency;

/** The host's pricing: the currencies it resolved, a rate, and the counter-value formatter. */
function pricing(overrides: Partial<RewardProps> = {}): RewardProps {
  return {
    currencies: new Map([[USDC_LEDGER_ID, USDC]]),
    getCounterValue: () => 1032,
    formatCountervalue: (value: number) => `$${(value / 100).toFixed(2)}`,
    ...overrides,
  };
}

const server = listenToCardApi();

function answerWith(body: JsonBodyType, status = 200) {
  const requests: URL[] = [];

  server.use(
    http.get(CARD_REWARD_WALLET_URL, ({ request }) => {
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
  it("shows nothing while the wallet is loading", () => {
    answerWith(mockPayCardRewardWallet());

    const { result } = renderViewModel();

    expect(result.current).toBeNull();
  });

  it("shows the wallet once it arrives, formatted with the given formatter", async () => {
    answerWith(mockPayCardRewardWallet());
    const formatAmount = jest.fn(() => "$10.32");

    const { result } = renderViewModel({ formatters: { amount: formatAmount } });

    await waitFor(() => expect(result.current).not.toBeNull());
    // A reward is paid in a token, so the asset's own magnitude applies, not a fiat two.
    expect(formatAmount).toHaveBeenCalledWith("10.32", "usdc", "crypto");
    expect(result.current).toEqual({
      amount: "$10.32",
      countervalue: null,
      subtitle: CARD_COPY.reward,
    });
  });

  it("falls back to a plain amount when no formatter is given", async () => {
    answerWith(mockPayCardRewardWallet());

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({
      amount: "10.32 USDC",
      countervalue: null,
      subtitle: CARD_COPY.reward,
    });
  });

  it("prices the reward through the host, which is what the banner leads with", async () => {
    answerWith(mockPayCardRewardWallet());

    const { result } = renderViewModel(pricing());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({
      amount: "10.32 USDC",
      countervalue: "$10.32",
      subtitle: CARD_COPY.reward,
    });
  });

  it("hands the resolved currency and the raw balance to the host's rate", async () => {
    answerWith(mockPayCardRewardWallet());
    const getCounterValue = jest.fn(() => 1032);

    const { result } = renderViewModel(pricing({ getCounterValue }));

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(getCounterValue).toHaveBeenCalledWith(USDC, "10.32");
  });

  it.each([
    ["the app has not resolved the currency", pricing({ currencies: new Map() })],
    ["no rate covers the balance", pricing({ getCounterValue: () => null })],
  ])("shows the asset amount alone when %s", async (_name, hostPricing) => {
    answerWith(mockPayCardRewardWallet());

    const { result } = renderViewModel(hostPricing);

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toMatchObject({ countervalue: null, subtitle: CARD_COPY.reward });
  });

  it("shows the asset amount alone for an asset the catalog does not map", async () => {
    answerWith({ ...mockPayCardRewardWallet(), currency: "doge" });

    const { result } = renderViewModel(pricing());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toMatchObject({ countervalue: null });
  });

  it("shows nothing when the read fails", async () => {
    answerWith({ message: "Internal server error" }, 500);

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current).toBeNull());
  });

  it("asks for nothing while nobody is signed in, so the provider never answers a 401", () => {
    const requests = answerWith(mockPayCardRewardWallet());

    const { result } = renderViewModel({ signedIn: false });

    expect(requests).toEqual([]);
    expect(result.current).toBeNull();
  });
});
