import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { mockPayCardRewardWallet } from "@domain/api-card-management/mock/card-wallets";
import { CARD_REWARD_WALLET_URL, listenToCardApi } from "@support/msw-features-flow-pay-card";
import { cardApiWrapper } from "../../__tests__/cardApiStore";
import { CARD_COPY } from "../../__tests__/i18nWrapper";
import { useRewardViewModel } from "./useRewardViewModel";
import type { RewardProps } from "./types";

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
    expect(formatAmount).toHaveBeenCalledWith("10.32", "usdc", "fiat");
    expect(result.current).toEqual({ amount: "$10.32", subtitle: CARD_COPY.reward });
  });

  it("falls back to a plain amount when no formatter is given", async () => {
    answerWith(mockPayCardRewardWallet());

    const { result } = renderViewModel();

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({ amount: "10.32 USDC", subtitle: CARD_COPY.reward });
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
