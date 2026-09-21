import React, { type PropsWithChildren } from "react";
import { act, render, screen, userEvent } from "@testing-library/react-native";
import type { CardAssetRow, CardAssetsViewModel } from "@features/flow-pay-card-assets";
import {
  cardApiWrapper,
  listenToCardApi,
  revealCardDetailsHandler,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";
import { ADD_TO_WALLET_COPY, CARD_COPY, MORE_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { FLIP_MS } from "../Reveal/useRevealViewModel";
import { CardDetails } from "./CardDetails";
import type { CardVisualProps } from "../../types";

const mockUseCardAssetsViewModel = jest.fn();

jest.mock("@features/flow-pay-card-auth", () => ({
  useIsCardSignedIn: () => true,
}));

jest.mock("@features/flow-pay-card-assets", () => ({
  ...jest.requireActual("@features/flow-pay-card-assets"),
  useCardAssetsViewModel: (...args: unknown[]) => mockUseCardAssetsViewModel(...args),
}));

listenToCardApi([...signedInCardApiHandlers, revealCardDetailsHandler]);

const StoreWrapper = cardApiWrapper({ signedIn: true });
const assets = {
  currencies: new Map(),
  priceWallet: () => 125.4,
  formatCountervalue: (value: number) => `$${value}`,
};

function Wrapper({ children }: PropsWithChildren) {
  return (
    <StoreWrapper>
      <I18nWrapper>{children}</I18nWrapper>
    </StoreWrapper>
  );
}

function renderCardDetails({ onTrackEvent = jest.fn() }: { onTrackEvent?: jest.Mock } = {}) {
  return {
    user: userEvent.setup(),
    onTrackEvent,
    ...render(<CardDetails onTrackEvent={onTrackEvent} />, { wrapper: Wrapper }),
  };
}

describe("CardDetails (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const row: CardAssetRow = {
      id: "w-usdc",
      currency: "usdc",
      network: "ethereum",
      name: "USD Coin",
      ticker: "USDC",
      ledgerId: "ethereum/erc20/usd__coin",
      cryptoAmount: "125.40 USDC",
      countervalue: "$125.40",
      countervalueAmount: 125.4,
    };
    const viewModel = {
      isVisible: true,
      status: "ready",
      rows: [row],
      dialogState: "closed",
      selectedAsset: null as CardAssetRow | null,
      selectedAssetTransactions: [],
      dialogCopy: {
        topUp: "Top up",
        withdraw: "Withdraw",
        transactions: "Transactions",
        withdrawTitle: "Withdraw",
        withdrawDescription: "Continue to withdraw",
        continue: "Continue",
      },
      onAssetPress: jest.fn((asset: CardAssetRow) => {
        viewModel.selectedAsset = asset;
      }),
      onDialogClose: jest.fn(),
      onTopUpPress: jest.fn(),
      onWithdrawPress: jest.fn(),
      onWithdrawClose: jest.fn(),
      onShowHistoryPress: jest.fn(),
      onWithdrawContinue: jest.fn(),
      onManagePress: jest.fn(),
      onAddAssetPress: jest.fn(),
      onReorderAssets: jest.fn(),
      reorderingAssetId: null,
    } satisfies CardAssetsViewModel;
    mockUseCardAssetsViewModel.mockReturnValue(viewModel);
  });

  it("should show the preview actions when the card details screen renders", () => {
    renderCardDetails();

    expect(screen.getByLabelText(CARD_COPY.placeholder)).toBeVisible();
    expect(screen.getByLabelText(CARD_COPY.details)).toBeVisible();
  });

  it("should keep the placeholder action disabled when the card preview is shown", () => {
    renderCardDetails();

    expect(screen.getByLabelText(CARD_COPY.placeholder).props.disabled).toBe(true);
  });

  it("should carry the same balance on the sheet's card face as on the tab's", async () => {
    const user = userEvent.setup();
    const cardVisual: CardVisualProps = {
      balance: 2500,
      balanceLabel: "Balance",
      formatCountervalue: (value: number) => ({
        integerPart: String(value),
        decimalPart: "00",
        currencyText: "$",
        decimalSeparator: ".",
        currencyPosition: "start",
      }),
    };
    render(<CardDetails onTrackEvent={jest.fn()} cardVisual={cardVisual} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));

    // One face in the tab, one in the sheet, and the balance is the same on both.
    const amounts = await screen.findAllByTestId("card-visual-amount");
    expect(amounts).toHaveLength(2);
    expect(amounts.map(amount => amount.props.value)).toEqual([2500, 2500]);
  });

  it("should keep the details sheet content hidden when Details has not been pressed", () => {
    renderCardDetails();

    expect(screen.queryByText(CARD_COPY.freeze)).toBeNull();
  });

  it("should open the details sheet when Details is pressed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeVisible();
  });

  it("should open add-to-wallet instructions from the details footer", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByTestId("pay-card-add-to-wallet-cta-entry"));

    expect(await screen.findByTestId("card-details-add-to-wallet-content")).toBeVisible();
    expect(screen.getByText(ADD_TO_WALLET_COPY.title)).toBeVisible();
  });

  it("should render funding assets in the overview when assets are provided", async () => {
    const user = userEvent.setup();
    render(<CardDetails assets={assets} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(await screen.findByTestId("card-assets")).toBeVisible();
    expect(screen.getByTestId("card-asset-w-usdc")).toBeVisible();
  });

  it("should return to the assets overview when asset details goes back", async () => {
    const user = userEvent.setup();
    render(<CardDetails assets={assets} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByTestId("card-asset-w-usdc"));
    expect(screen.getByTestId("card-asset-details-drawer")).toBeVisible();

    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-assets")).toBeVisible();
    expect(screen.queryByTestId("card-asset-details-drawer")).not.toBeOnTheScreen();
  });

  it("should return to asset details when withdraw goes back", async () => {
    const user = userEvent.setup();
    render(<CardDetails assets={assets} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByTestId("card-asset-w-usdc"));
    await user.press(screen.getByText("Withdraw"));
    expect(screen.getByTestId("card-asset-withdraw-drawer")).toBeVisible();

    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-asset-details-drawer")).toBeVisible();
    expect(screen.queryByTestId("card-asset-withdraw-drawer")).not.toBeOnTheScreen();
  });

  it("should show the card numbers image after View", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText(CARD_COPY.numbersReveal));

    const image = await screen.findByLabelText(CARD_COPY.numbersImageAlt, {
      includeHiddenElements: true,
    });
    jest.useFakeTimers();
    try {
      await act(() => {
        image.props.onLoad();
      });
      act(() => {
        jest.advanceTimersByTime(FLIP_MS);
      });
    } finally {
      jest.useRealTimers();
    }

    expect(screen.getByLabelText(CARD_COPY.numbersImageAlt)).toBeVisible();
    expect(screen.getByText(CARD_COPY.numbersHide)).toBeVisible();
    expect(screen.queryByText(CARD_COPY.numbersReveal)).not.toBeOnTheScreen();

    await user.press(screen.getByText(CARD_COPY.numbersHide));

    expect(screen.queryByLabelText(CARD_COPY.numbersImageAlt)).not.toBeOnTheScreen();
    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
  });

  it("should navigate to More without opening another sheet", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByLabelText(MORE_COPY.tile));

    expect(screen.getByText(MORE_COPY.rows.managePin)).toBeVisible();
    expect(screen.getByTestId("card-details-more-content")).toBeVisible();
  });

  it("should return to the overview when leaving More through back", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByLabelText(MORE_COPY.tile));
    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-more-content")).toBeNull();
  });

  it("should navigate to freeze confirmation without opening another sheet", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(screen.getByText(CARD_COPY.freeze));

    expect(screen.getByText(CARD_COPY.freezeTitle)).toBeVisible();
    expect(screen.getByTestId("card-details-freeze-content")).toBeVisible();
  });

  it("should return to the overview when the freeze confirmation is cancelled", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(screen.getByText(CARD_COPY.freeze));
    await user.press(screen.getByTestId("freeze-confirm-cancel"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-freeze-content")).toBeNull();
  });

  it("should open the selected transaction in the same sheet and track the click", async () => {
    const { user, onTrackEvent } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("NETFLIX.COM"));

    expect(screen.getByTestId("card-details-transaction-content")).toBeVisible();
    expect(onTrackEvent).toHaveBeenCalledWith("transaction_clicked", {
      category: "card",
      transaction: "out",
      page: "Pay",
      cardFundSourceAsset: "USDC",
    });
  });

  it("should return to the overview when leaving transaction details through back", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("NETFLIX.COM"));
    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-transaction-content")).toBeNull();
  });

  it("should reopen on the overview after transaction details are dismissed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("NETFLIX.COM"));
    await user.press(screen.getByTestId("card-details-sheet-dismiss"));
    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-transaction-content")).toBeNull();
  });
});
