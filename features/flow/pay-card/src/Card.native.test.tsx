import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { cardManagementApi } from "@domain/api-card-management";
import type { PayCardAuthStatus } from "@features/flow-pay-card-auth";
import type { CardProps } from "./Card.types";
import { cardTestWrapper, createCardTestStore } from "./__tests__/cardTestStore";

const mockUseCardAuthStatus = jest.fn<PayCardAuthStatus, []>();
const mockUseWalletsTotal = jest.fn(() => ({ total: 0, isLoading: false, isError: false }));
let receivedCardSettingsActions: CardProps["cardSettingsActions"];
let receivedDetailsChooseCardType: (() => void) | undefined;
let receivedDetailsOnTopUp: (() => void) | undefined;
let receivedDetailsCardState: string | undefined;
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

jest.mock("@features/flow-pay-card-auth", () => ({
  CardLogin: ({ children }: { children?: React.ReactNode }) => (
    <View testID="card-login">{children}</View>
  ),
  useCardAuthStatus: () => mockUseCardAuthStatus(),
}));

jest.mock("@features/flow-pay-card-details", () => ({
  CardArtwork: () => <View testID="card-artwork" />,
  CardLoadingVisual: () => <View testID="card-loading-visual" />,
  CardDetails: ({
    cardVisual,
    assets,
    cardSettingsActions,
    onChooseCardType,
    onTopUp,
    cardState,
  }: {
    cardVisual?: unknown;
    assets?: unknown;
    cardSettingsActions?: CardProps["cardSettingsActions"];
    onChooseCardType?: () => void;
    onTopUp?: () => void;
    cardState?: string;
  }) => {
    receivedCardSettingsActions = cardSettingsActions;
    receivedDetailsChooseCardType = onChooseCardType;
    receivedDetailsOnTopUp = onTopUp;
    receivedDetailsCardState = cardState;
    return (
      <View
        testID={cardVisual ? "card-details-with-visual" : "card-details"}
        accessibilityLabel={assets ? "details-with-assets" : "details-without-assets"}
      />
    );
  },
}));

jest.mock("@features/flow-pay-card-widget", () => ({
  CardOnboardingWidget: ({ onChooseCardType }: { onChooseCardType?: () => void }) => {
    receivedWidgetChooseCardType = onChooseCardType;
    return <View testID="card-onboarding-widget" />;
  },
}));

jest.mock("@features/flow-pay-card-widget/onboarding-status", () => ({
  useCardOnboardingStatus: () => mockOnboardingStatus,
}));

jest.mock("@features/flow-pay-card-assets", () => ({
  CardAssets: () => <View testID="card-assets" />,
  useCardWalletsTotal: () => mockUseWalletsTotal(),
}));

jest.mock("@features/flow-pay-card-widget/native", () => ({
  AddToWalletCtaWithBottomSheet: () => <View testID="card-add-to-wallet-cta" />,
}));

jest.mock("./useCardLifecycleTracking", () => ({
  useCardLifecycleTracking: jest.fn(),
}));

jest.mock("./useCardStatusRefresh", () => ({
  useCardStatusRefresh: jest.fn(),
}));

import { Card } from "./Card";

function renderCard(card: React.ReactElement, store = createCardTestStore()) {
  return render(card, { wrapper: cardTestWrapper(store) });
}

const oauthConfig: CardProps["login"]["oauthConfig"] = {
  apiUrl: "https://card.example",
  clientId: "client-id",
  hostedUiUrl: "https://hosted.example",
  redirectUri: "https://card.example/callback",
};

const formatters: CardProps["formatters"] = {
  countervalue: (value: number) => ({
    integerPart: String(value),
    decimalPart: "00",
    currencyText: "$",
    decimalSeparator: ".",
    currencyPosition: "start",
  }),
};

describe("Card (native)", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mockUseCardAuthStatus.mockReturnValue("unknown");
    mockOnboardingStatus = accountOnboarding;
    receivedCardSettingsActions = undefined;
    receivedDetailsChooseCardType = undefined;
    receivedDetailsOnTopUp = undefined;
    receivedDetailsCardState = undefined;
    receivedWidgetChooseCardType = undefined;
  });

  describe("while resolving the session", () => {
    it("shows only the bare artwork, holding back the widget and card details", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-onboarding-widget")).toBeNull();
      expect(screen.queryByTestId("card-details")).toBeNull();
    });

    it("shows the loading card face once the host provides a formatter", () => {
      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(screen.getByTestId("card-loading-visual")).toBeVisible();
      expect(screen.queryByTestId("card-artwork")).toBeNull();
    });
  });

  describe("while signed out", () => {
    beforeEach(() => {
      mockUseCardAuthStatus.mockReturnValue("signedOut");
    });

    it("shows the bare artwork above the login, with no card details", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.getByTestId("card-login")).toBeVisible();
      expect(screen.queryByTestId("card-details")).toBeNull();
      expect(screen.queryByTestId("pay-card-disclaimer")).toBeNull();
    });

    it("never builds the balance overlay, even when the host provides a formatter", () => {
      renderCard(<Card login={{ oauthConfig }} formatters={formatters} />);

      expect(screen.getByTestId("card-artwork")).toBeVisible();
      expect(screen.queryByTestId("card-details-with-visual")).toBeNull();
    });
  });

  describe("once signed in", () => {
    beforeEach(() => {
      mockUseCardAuthStatus.mockReturnValue("signedIn");
    });

    it("shows the widget and the card details, with no login or bare artwork", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByTestId("card-onboarding-widget")).toBeVisible();
      expect(screen.getByTestId("card-details")).toBeVisible();
      expect(screen.getByTestId("card-add-to-wallet-cta")).toBeVisible();
      expect(screen.queryByTestId("card-login")).toBeNull();
      expect(screen.queryByTestId("card-artwork")).toBeNull();
      expect(screen.queryByTestId("pay-card-disclaimer")).toBeNull();
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
      expect(screen.queryByTestId("card-details")).toBeNull();
      expect(screen.queryByTestId("card-login")).toBeNull();
    });

    it("hands the assets list to the details block, which shows it in its sheet", () => {
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

      // Handed to the details block, not rendered beside it: the sheet is where the design lists
      // the assets.
      expect(screen.getByLabelText("details-with-assets")).toBeTruthy();
    });

    it("leaves the details block without a list when the host passes no assets", () => {
      renderCard(<Card login={{ oauthConfig }} />);

      expect(screen.getByLabelText("details-without-assets")).toBeTruthy();
    });

    it("should tell the details block to choose a card type while that step is current", () => {
      const onChooseCardType = jest.fn();
      const onTopUp = jest.fn();
      mockOnboardingStatus = choosingCardType();

      renderCard(
        <Card login={{ oauthConfig }} onChooseCardType={onChooseCardType} onTopUp={onTopUp} />,
      );

      expect(receivedDetailsCardState).toBe("choosingCardType");
      expect(receivedDetailsOnTopUp).toBe(onTopUp);
      expect(receivedWidgetChooseCardType).toBe(receivedDetailsChooseCardType);
      expect(screen.queryByTestId("card-add-to-wallet-cta")).toBeNull();
    });

    it("should invalidate the card reads once the order card page hands back", async () => {
      let handBack: (() => void) | undefined;
      const onChooseCardType = jest.fn(
        () =>
          new Promise<void>(resolve => {
            handBack = resolve;
          }),
      );

      const store = createCardTestStore();
      const dispatch = jest.spyOn(store, "dispatch");
      renderCard(<Card login={{ oauthConfig }} onChooseCardType={onChooseCardType} />, store);
      receivedDetailsChooseCardType?.();

      expect(onChooseCardType).toHaveBeenCalledTimes(1);
      expect(dispatch).not.toHaveBeenCalled();

      handBack?.();

      await waitFor(() =>
        expect(dispatch).toHaveBeenCalledWith(
          cardManagementApi.util.invalidateTags([
            "CardStatus",
            "CardTransactions",
            "CardLinkedWallets",
          ]),
        ),
      );
    });

    it("should keep top up on the details block while the card status read is still in flight", () => {
      const onChooseCardType = jest.fn();
      mockOnboardingStatus = choosingCardType({ isLoading: true });

      renderCard(
        <Card login={{ oauthConfig }} onChooseCardType={onChooseCardType} onTopUp={jest.fn()} />,
      );

      expect(receivedDetailsCardState).toBe("ready");
      receivedWidgetChooseCardType?.();
      expect(onChooseCardType).toHaveBeenCalledTimes(1);
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

describe("live app login page", () => {
  it("keeps the login page after a session exists", () => {
    mockUseCardAuthStatus.mockReturnValue("signedIn");

    renderCard(<Card login={{ oauthConfig, keepLoginPage: true }} onTopUp={jest.fn()} />);

    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByTestId("card-login")).toBeVisible();
    expect(screen.queryByTestId("card-details")).toBeNull();
  });
});
