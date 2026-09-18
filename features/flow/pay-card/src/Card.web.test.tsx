import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { PayCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { CardFormatters, CardProps } from "./Card.types";
import { CARD_TITLE, I18nWrapper } from "./__tests__/i18nWrapper";

let mockStatus: PayCardAuthStatus = "unknown";
let receivedDetailsFormatters: CardTransactionFormatters | undefined;
const mockUseWalletsTotal = jest.fn(() => ({ total: 0, isLoading: false, isError: false }));
let receivedTransactionFormatters: CardTransactionFormatters | undefined;
let receivedTransactionTracker: CardProps["login"]["onTrackEvent"];

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <div data-testid="card-login" />,
  useCardAuthStatus: () => mockStatus,
  useIsCardSignedIn: () => mockStatus === "signedIn",
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <div data-testid="card-artwork" />,
  CardVisual: () => <div data-testid="card-visual" />,
  CardDetails: ({
    cardVisual,
    formatters,
  }: {
    cardVisual?: { balance: number };
    formatters?: CardTransactionFormatters;
  }) => {
    receivedDetailsFormatters = formatters;
    return (
      <div
        data-testid={cardVisual ? "card-details-with-visual" : "card-details"}
        data-balance={cardVisual?.balance}
      />
    );
  },
  CardTopUpButton: ({ onTopUp }: { onTopUp?: () => void }) =>
    onTopUp ? (
      <button type="button" data-testid="card-top-up" onClick={onTopUp}>
        Top up
      </button>
    ) : null,
}));

jest.mock("@features/flow-pay-card-widget", () => ({
  CardOnboardingWidget: () => <div data-testid="card-onboarding-widget" />,
}));

jest.mock("@features/flow-pay-card-assets", () => ({
  CardAssets: () => <div data-testid="card-assets" />,
  useCardWalletsTotal: () => mockUseWalletsTotal(),
}));

jest.mock("@features/flow-pay-card-transactions", () => ({
  CardTransactions: ({
    formatters,
    onTrackEvent,
  }: {
    formatters?: CardTransactionFormatters;
    onTrackEvent?: CardProps["login"]["onTrackEvent"];
  }) => {
    receivedTransactionFormatters = formatters;
    receivedTransactionTracker = onTrackEvent;
    return <div data-testid="card-transactions" />;
  },
}));

import { Card } from "./Card";

const title = CARD_TITLE;

function renderCard(card: React.ReactElement) {
  return render(card, { wrapper: I18nWrapper });
}

const oauthConfig: CardProps["login"]["oauthConfig"] = {
  apiUrl: "https://card.example",
  clientId: "client-id",
  hostedUiUrl: "https://hosted.example",
  redirectUri: "https://card.example/callback",
};

const formatters: CardFormatters = {
  countervalue: (value: number) => ({
    integerPart: String(value),
    decimalPart: "00",
    currencyText: "$",
    decimalSeparator: ".",
    currencyPosition: "start",
  }),
};

describe("Card (web)", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mockStatus = "unknown";
    receivedDetailsFormatters = undefined;
    receivedTransactionFormatters = undefined;
    receivedTransactionTracker = undefined;
  });

  it("always shows the card title", () => {
    renderCard(<Card login={{ oauthConfig }} />);

    expect(screen.getByText(title)).toBeVisible();
  });

  describe("while resolving the session", () => {
    it("shows only the bare artwork, holding back the widget and the card details", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-onboarding-widget")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-details-with-visual")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-transactions")).not.toBeInTheDocument();
    });
  });

  describe("while signed out", () => {
    beforeEach(() => {
      mockStatus = "signedOut";
    });

    it("shows the bare artwork above the login, with no card details or widget", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.getByTestId("card-login")).toBeVisible();
      expect(screen.queryByTestId("card-onboarding-widget")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-transactions")).not.toBeInTheDocument();
    });

    it("never builds the balance overlay, even when the host provides a formatter", () => {
      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-details-with-visual")).not.toBeInTheDocument();
    });

    it("does not mount the card details", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
    });

    it("shows no top up button, even when the host wires one", () => {
      renderCard(<Card login={{ oauthConfig }} onTopUp={jest.fn()} />);

      expect(screen.queryByTestId("card-top-up")).not.toBeInTheDocument();
    });
  });

  describe("once signed in", () => {
    beforeEach(() => {
      mockStatus = "signedIn";
    });

    it("shows the widget and the card details, with no login or bare artwork", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-onboarding-widget")).toBeVisible();
      expect(screen.getByTestId("card-details")).toBeVisible();
      expect(screen.getByTestId("card-transactions")).toBeVisible();
      expect(screen.queryByTestId("card-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-artwork")).not.toBeInTheDocument();
    });

    it("hands the card visual to the details block once the host provides a formatter", () => {
      renderCard(
        <Card
          login={{ oauthConfig }}
          formatters={formatters}
          assets={{
            currencies: new Map(),
            priceWallet: () => null,
            formatCountervalue: String,
          }}
        />,
      );

      expect(screen.getByTestId("card-details-with-visual")).toBeVisible();
      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-login")).not.toBeInTheDocument();
    });

    it("shows what the funding wallets are worth on the card face", () => {
      mockUseWalletsTotal.mockReturnValue({ total: 2500, isLoading: false, isError: false });

      renderCard(
        <Card
          login={{ oauthConfig }}
          formatters={formatters}
          assets={{
            currencies: new Map(),
            priceWallet: () => null,
            formatCountervalue: String,
          }}
        />,
      );

      // The summed worth of the wallets, as the assets package priced them.
      expect(screen.getByTestId("card-details-with-visual")).toHaveAttribute(
        "data-balance",
        "2500",
      );
    });

    it("shows the bare artwork rather than a zero when the wallets could not be read", () => {
      mockUseWalletsTotal.mockReturnValue({ total: 0, isLoading: false, isError: true });

      renderCard(
        <Card
          login={{ oauthConfig }}
          formatters={formatters}
          assets={{
            currencies: new Map(),
            priceWallet: () => null,
            formatCountervalue: String,
          }}
        />,
      );

      // A formatted zero would read as a real balance; the Assets list is what reports the failure.
      expect(screen.getByTestId("card-details")).toBeVisible();
      expect(screen.queryByTestId("card-details-with-visual")).not.toBeInTheDocument();
    });

    it("shows the bare artwork for a host that lists no assets to sum", () => {
      mockUseWalletsTotal.mockReturnValue({ total: 0, isLoading: false, isError: false });

      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(screen.getByTestId("card-details")).toBeVisible();
      expect(screen.queryByTestId("card-details-with-visual")).not.toBeInTheDocument();
    });

    it("hands the transaction formatters to the transactions list", () => {
      const transactionAmount = jest.fn();
      const transactionDate = jest.fn();

      renderCard(
        <Card login={{ oauthConfig }} formatters={{ transactionAmount, transactionDate }} />,
      );

      expect(receivedTransactionFormatters?.amount).toBe(transactionAmount);
      expect(receivedTransactionFormatters?.date).toBe(transactionDate);
    });

    it("hands the amount formatter to the details block, for the reward balance", () => {
      const transactionAmount = jest.fn();

      renderCard(<Card login={{ oauthConfig }} formatters={{ transactionAmount }} />);

      expect(receivedDetailsFormatters?.amount).toBe(transactionAmount);
    });

    it("hands the host tracker to the transactions list", () => {
      const onTrackEvent = jest.fn();

      renderCard(<Card login={{ oauthConfig, onTrackEvent }} />);

      expect(receivedTransactionTracker).toBe(onTrackEvent);
    });

    it("opens the top up from the button the host wired", () => {
      const onTopUp = jest.fn();

      renderCard(<Card login={{ oauthConfig }} onTopUp={onTopUp} />);
      fireEvent.click(screen.getByTestId("card-top-up"));

      expect(onTopUp).toHaveBeenCalledTimes(1);
    });

    it("shows no top up button when the host wires none", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.queryByTestId("card-top-up")).not.toBeInTheDocument();
    });
  });
});
