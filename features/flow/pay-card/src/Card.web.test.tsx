import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import type { PayCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { CardFormatters, CardProps } from "./Card.types";
import { CARD_TITLE, I18nWrapper } from "./__tests__/i18nWrapper";

let mockStatus: PayCardAuthStatus = "unknown";
let receivedTransactionFormatters: CardTransactionFormatters | undefined;
let receivedTransactionTracker: CardProps["login"]["onTrackEvent"];
let receivedAssetFormatter: CardFormatters["countervalue"];

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: () => <div data-testid="card-login" />,
  useCardAuthStatus: () => mockStatus,
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <div data-testid="card-artwork" />,
  CardVisual: () => <div data-testid="card-visual" />,
  CardDetails: ({ cardVisual, unlock }: { cardVisual?: unknown; unlock?: unknown }) => (
    <div
      data-testid={cardVisual ? "card-details-with-visual" : "card-details"}
      data-unlock={unlock ? "granted" : "none"}
    />
  ),
}));

jest.mock("@features/flow-pay-card-widget", () => ({
  CardOnboardingWidget: () => <div data-testid="card-onboarding-widget" />,
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

jest.mock("@features/flow-pay-card-assets", () => ({
  CardAssets: ({ formatCountervalue }: { formatCountervalue?: CardFormatters["countervalue"] }) => {
    receivedAssetFormatter = formatCountervalue;
    return <div data-testid="card-assets" />;
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
    receivedTransactionFormatters = undefined;
    receivedTransactionTracker = undefined;
    receivedAssetFormatter = undefined;
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
      expect(screen.queryByTestId("card-assets")).not.toBeInTheDocument();
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
      expect(screen.queryByTestId("card-assets")).not.toBeInTheDocument();
    });

    it("never builds the balance overlay, even when the host provides a formatter", () => {
      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-details-with-visual")).not.toBeInTheDocument();
    });

    it("does not mount the card details even when unlock is passed", () => {
      renderCard(<Card login={{ oauthConfig }} unlock={jest.fn()} />);

      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
    });
  });

  describe("once signed in", () => {
    beforeEach(() => {
      mockStatus = "signedIn";
    });

    it("shows the widget, card details, CardAssets, and transactions, with no login or bare artwork", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-onboarding-widget")).toBeVisible();
      expect(screen.getByTestId("card-details")).toBeVisible();
      expect(screen.getByTestId("card-assets")).toBeVisible();
      expect(screen.getByTestId("card-transactions")).toBeVisible();
      expect(screen.queryByTestId("card-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-artwork")).not.toBeInTheDocument();
    });

    it("hands the card visual to the details block once the host provides a formatter", () => {
      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(screen.getByTestId("card-details-with-visual")).toBeVisible();
      expect(screen.queryByTestId("card-details")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-login")).not.toBeInTheDocument();
    });

    it("hands the host countervalue formatter to CardAssets", () => {
      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(receivedAssetFormatter).toBe(formatters.countervalue);
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

    it("hands the host tracker to the transactions list", () => {
      const onTrackEvent = jest.fn();

      renderCard(<Card login={{ oauthConfig, onTrackEvent }} />);

      expect(receivedTransactionTracker).toBe(onTrackEvent);
    });

    it("leaves the details block without an unlock when the host omits one", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-details")).toHaveAttribute("data-unlock", "none");
    });

    it("hands the unlock to the details block when the host passes one", () => {
      renderCard(<Card login={{ oauthConfig }} unlock={jest.fn()} />);

      expect(screen.getByTestId("card-details")).toHaveAttribute("data-unlock", "granted");
    });
  });
});
