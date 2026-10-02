import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { PayCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardTransactionFormatters } from "@features/flow-pay-card-transactions";
import type { CardFormatters, CardProps } from "./Card.types";
import { CARD_DISCLAIMER, CARD_TITLE } from "./__tests__/i18nWrapper";
import { cardTestWrapper, createCardTestStore } from "./__tests__/cardTestStore";

let mockStatus: PayCardAuthStatus = "unknown";
let receivedWidgetChooseCardType: (() => void) | undefined;

type OnboardingStatus = {
  data: { steps: { id: string; isDone: boolean }[]; completedCount: number };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  hasSourceError: boolean;
  refresh: () => void;
};

const accountOnboarding: OnboardingStatus = {
  data: {
    steps: [
      { id: "create-account", isDone: false },
      { id: "choose-card-type", isDone: false },
    ],
    completedCount: 0,
  },
  isLoading: false,
  isFetching: false,
  isError: false,
  hasSourceError: false,
  refresh: jest.fn(),
};

function choosingCardType(overrides: Partial<OnboardingStatus> = {}): OnboardingStatus {
  return {
    ...accountOnboarding,
    ...overrides,
    data: {
      steps: [
        { id: "create-account", isDone: true },
        { id: "choose-card-type", isDone: false },
      ],
      completedCount: 1,
    },
  };
}

let mockOnboardingStatus = accountOnboarding;
let receivedDetailsFormatters: CardTransactionFormatters | undefined;
let receivedCardState: string | undefined;
const mockUseWalletsTotal = jest.fn(() => ({ total: 0, isLoading: false, isError: false }));
let receivedTransactionFormatters: CardTransactionFormatters | undefined;
let receivedCardSettingsActions: CardProps["cardSettingsActions"];

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="card-login">{children}</div>
  ),
  useCardAuthStatus: () => mockStatus,
  useIsCardSignedIn: () => mockStatus === "signedIn",
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <div data-testid="card-artwork" />,
  CardVisual: () => <div data-testid="card-visual" />,
  CardLoadingVisual: () => <div data-testid="card-loading-visual" />,
  CardDetails: ({
    cardVisual,
    formatters,
    cardSettingsActions,
    cardState,
  }: {
    cardVisual?: { balance: number };
    formatters?: CardTransactionFormatters;
    cardSettingsActions?: CardProps["cardSettingsActions"];
    cardState?: string;
  }) => {
    receivedDetailsFormatters = formatters;
    receivedCardSettingsActions = cardSettingsActions;
    receivedCardState = cardState;
    return (
      <div
        data-testid={cardVisual ? "card-details-with-visual" : "card-details"}
        data-balance={cardVisual?.balance}
      />
    );
  },
  CardPrimaryActionButton: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <button type="button" data-testid="card-primary-action" onClick={onPress}>
      {label}
    </button>
  ),
}));

jest.mock("@features/flow-pay-card-widget", () => ({
  CardOnboardingWidget: ({ onChooseCardType }: { onChooseCardType?: () => void }) => {
    receivedWidgetChooseCardType = onChooseCardType;
    return <div data-testid="card-onboarding-widget" />;
  },
}));

jest.mock("@features/flow-pay-card-widget/onboarding-status", () => ({
  useCardOnboardingStatus: () => mockOnboardingStatus,
}));

jest.mock("@features/flow-pay-card-assets", () => ({
  CardAssets: () => <div data-testid="card-assets" />,
  useCardWalletsTotal: () => mockUseWalletsTotal(),
}));

jest.mock("@features/flow-pay-card-transactions", () => ({
  CardTransactions: ({ formatters }: { formatters?: CardTransactionFormatters }) => {
    receivedTransactionFormatters = formatters;
    return <div data-testid="card-transactions" />;
  },
}));

jest.mock("./useCardLifecycleTracking", () => ({
  useCardLifecycleTracking: jest.fn(),
}));
import { Card } from "./Card";

const title = CARD_TITLE;

function renderCard(card: React.ReactElement) {
  return render(card, { wrapper: cardTestWrapper(createCardTestStore()) });
}

const oauthConfig: CardProps["login"]["oauthConfig"] = {
  apiUrl: "https://card.example",
  clientId: "client-id",
  hostedUiUrl: "https://hosted.example",
  redirectUri: "https://card.example/callback",
};

const fundingAssets: CardProps["assets"] = {
  currencies: new Map(),
  getCounterValue: () => null,
  formatCountervalue: String,
  onWithdraw: jest.fn(),
  onAddAsset: jest.fn(),
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
    mockOnboardingStatus = accountOnboarding;
    receivedWidgetChooseCardType = undefined;
    receivedDetailsFormatters = undefined;
    receivedCardState = undefined;
    receivedTransactionFormatters = undefined;
    receivedCardSettingsActions = undefined;
  });

  it("always shows the card title", () => {
    renderCard(<Card login={{ oauthConfig }} />);

    expect(screen.getByText(title)).toBeVisible();
  });

  it("always shows the disclaimer", () => {
    renderCard(<Card login={{ oauthConfig }} />);

    expect(screen.getByText(CARD_DISCLAIMER)).toBeVisible();
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
      expect(screen.getByText(CARD_DISCLAIMER)).toBeVisible();
      expect(screen.getByTestId("pay-card-disclaimer")).toHaveClass("mt-auto");
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

      expect(screen.queryByTestId("card-primary-action")).not.toBeInTheDocument();
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
      expect(screen.getByText(CARD_DISCLAIMER)).toBeVisible();
      expect(screen.getByTestId("pay-card-disclaimer")).not.toHaveClass("mt-auto");
      expect(screen.queryByTestId("card-login")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-artwork")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-assets")).not.toBeInTheDocument();
    });

    it("shows the assets list as soon as the host provides the section", () => {
      renderCard(
        <Card
          login={{ oauthConfig }}
          assets={{
            currencies: new Map(),
            getCounterValue: () => null,
            formatCountervalue: String,
            onWithdraw: jest.fn(),
            onAddAsset: jest.fn(),
          }}
        />,
      );

      expect(screen.getByTestId("card-assets")).toBeVisible();
    });

    it("hands the card visual to the details block once the host provides a formatter", () => {
      renderCard(
        <Card
          login={{ oauthConfig }}
          formatters={formatters}
          assets={{
            currencies: new Map(),
            getCounterValue: () => null,
            formatCountervalue: String,
            onWithdraw: jest.fn(),
            onAddAsset: jest.fn(),
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
            getCounterValue: () => null,
            formatCountervalue: String,
            onWithdraw: jest.fn(),
            onAddAsset: jest.fn(),
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
            getCounterValue: () => null,
            formatCountervalue: String,
            onWithdraw: jest.fn(),
            onAddAsset: jest.fn(),
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

    it("opens the top up from the button the host wired", () => {
      const onTopUp = jest.fn();

      renderCard(<Card login={{ oauthConfig }} onTopUp={onTopUp} />);
      fireEvent.click(screen.getByTestId("card-primary-action"));

      expect(onTopUp).toHaveBeenCalledTimes(1);
    });

    it("shows the disclaimer above the top up button", () => {
      renderCard(<Card login={{ oauthConfig }} onTopUp={jest.fn()} />);

      const disclaimer = screen.getByTestId("pay-card-disclaimer");
      const topUp = screen.getByTestId("card-primary-action");

      expect(
        disclaimer.compareDocumentPosition(topUp) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("shows no top up button when the host wires none", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.queryByTestId("card-primary-action")).not.toBeInTheDocument();
    });

    it("should replace top up with choose card type and hide funding sections when that step is current", () => {
      const onChooseCardType = jest.fn();
      mockOnboardingStatus = choosingCardType();

      renderCard(
        <Card
          login={{ oauthConfig }}
          onTopUp={jest.fn()}
          onChooseCardType={onChooseCardType}
          assets={fundingAssets}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Choose card type" }));

      expect(screen.queryByRole("button", { name: "Top up" })).not.toBeInTheDocument();
      expect(receivedCardState).toBe("choosingCardType");
      expect(screen.queryByTestId("card-assets")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-transactions")).not.toBeInTheDocument();
      expect(onChooseCardType).toHaveBeenCalledTimes(1);
      receivedWidgetChooseCardType?.();
      expect(onChooseCardType).toHaveBeenCalledTimes(2);
    });

    it("should keep top up and funding sections while the card status read is still in flight", () => {
      mockOnboardingStatus = choosingCardType({ isLoading: true });

      renderCard(
        <Card
          login={{ oauthConfig }}
          onTopUp={jest.fn()}
          onChooseCardType={jest.fn()}
          assets={fundingAssets}
        />,
      );

      expect(screen.getByRole("button", { name: "Top up" })).toBeVisible();
      expect(receivedCardState).toBe("ready");
      expect(screen.getByTestId("card-assets")).toBeVisible();
      expect(screen.getByTestId("card-transactions")).toBeVisible();
      expect(screen.queryByRole("button", { name: "Choose card type" })).not.toBeInTheDocument();
    });

    it("hands the settings actions to the details block", () => {
      const cardSettingsActions: CardProps["cardSettingsActions"] = {
        onManagePin: jest.fn(),
        onAccessBaanx: jest.fn(),
      };

      renderCard(<Card login={{ oauthConfig }} cardSettingsActions={cardSettingsActions} />);

      expect(receivedCardSettingsActions).toEqual(cardSettingsActions);
    });
  });
});
