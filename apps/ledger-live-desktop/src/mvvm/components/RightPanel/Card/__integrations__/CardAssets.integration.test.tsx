import React from "react";
import { mockPayCardStatus } from "@domain/api-card-management/mock/card-onboarding-status";
import { getEnv } from "@shared/env";
import { http, HttpResponse, server } from "tests/server";
import { render, screen } from "tests/testSetup";
import { initialCountervaluesMock } from "tests/mocks/countervalues.mock";
import { Card } from "../Card";

const CARD_API = getEnv("CARD_BAANX_API_URL");
const CAL_TOKENS_URL = `${getEnv("CAL_SERVICE_URL")}/v1/tokens`;
const USDC_ID = "ethereum/erc20/usd__coin";

const signedIn = { payCardAuth: { hasCard: true, status: "signedIn" as const } };

/** `btc.bitcoin` and `usdc.ethereum` are both in the Baanx catalog, so both resolve a currency. */
const linkedWallets = [
  { id: "w-btc", address: "bc1qcardwallet", currency: "btc", network: "bitcoin", priority: 0 },
  { id: "w-usdc", address: "0xcardwallet", currency: "usdc", network: "ethereum", priority: 1 },
];

const internalWallets = [
  {
    id: "w-btc",
    balance: "0.5",
    currency: "btc",
    address: "bc1qcardwallet",
    addressMemo: null,
    addressId: "0x1111111111111111111111111111111111111111",
  },
  {
    id: "w-usdc",
    balance: "125.40",
    currency: "usdc",
    address: "0xcardwallet",
    addressMemo: null,
    addressId: "0x2222222222222222222222222222222222222222",
  },
];

/** What CAL answers for the token: the coin comes from the local registry, so only this is served. */
const usdcToken = {
  id: USDC_ID,
  contract_address: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
  standard: "erc20",
  decimals: 6,
  delisted: false,
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
};

describe("Card assets", () => {
  beforeEach(() => {
    server.use(
      http.get(`${CARD_API}/v1/card/status`, () => HttpResponse.json(mockPayCardStatus())),
      http.get(`${CARD_API}/v1/wallet/internal/card_linked`, () =>
        HttpResponse.json(linkedWallets),
      ),
      http.get(`${CARD_API}/v1/wallet/internal`, () => HttpResponse.json(internalWallets)),
      http.get(CAL_TOKENS_URL, ({ request }) => {
        const id = new URL(request.url).searchParams.get("id");
        return HttpResponse.json(id === USDC_ID ? [usdcToken] : []);
      }),
    );
  });

  it("lists every linked wallet on the card, named after the currency it resolved to", async () => {
    render(<Card />, { initialState: signedIn });

    // The coin comes from the crypto registry; the token has to come back from CAL.
    expect(await screen.findByText("Bitcoin")).toBeVisible();
    expect(await screen.findByText("USD Coin")).toBeVisible();
    expect(screen.getByText("0.5 BTC")).toBeVisible();
    expect(screen.getByText("125.40 USDC")).toBeVisible();
  });

  it("prices each wallet against the counter value the state carries", async () => {
    render(<Card />, { initialState: signedIn, initialCountervalues: initialCountervaluesMock });

    // The seeded rate is 30257.43 USD for bitcoin, so half a coin is a little over 15,128.
    expect(await screen.findByText(/15,12/)).toBeVisible();
  });

  it("shows what the asset is worth on top of the details the row opens", async () => {
    const { user } = render(<Card />, {
      initialState: signedIn,
      initialCountervalues: initialCountervaluesMock,
    });

    await user.click(await screen.findByText("Bitcoin"));

    expect(await screen.findByLabelText("Bitcoin BTC")).toBeVisible();
  });
});
