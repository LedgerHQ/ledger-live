import React, { type PropsWithChildren } from "react";
import { act, render, screen, userEvent, within } from "@testing-library/react-native";
import {
  cardApiWrapper,
  CARD_API_BASE_URL,
  listenToCardApi,
  revealCardDetailsHandler,
  signedInCardApiHandlers,
} from "@support/msw-features-flow-pay-card";
import { http, HttpResponse } from "msw";
import {
  mockPayCardInternalWallets,
  mockPayCardLinkedWallets,
} from "@domain/api-card-management/mock/card-wallets";
import { ADD_TO_WALLET_COPY, CARD_COPY, MORE_COPY, I18nWrapper } from "../../__tests__/i18nWrapper";
import { FLIP_MS } from "../Reveal/useRevealViewModel";
import { CardDetails } from "./CardDetails";
import type { CardDetailsProps, CardVisualProps } from "../../types";

jest.mock("@features/flow-pay-card-auth", () => ({
  useIsCardSignedIn: () => true,
}));

listenToCardApi([
  ...signedInCardApiHandlers,
  revealCardDetailsHandler,
  http.get(`${CARD_API_BASE_URL}/v1/wallet/internal`, () =>
    HttpResponse.json(mockPayCardInternalWallets(true)),
  ),
  http.get(`${CARD_API_BASE_URL}/v1/wallet/internal/card_linked`, () =>
    HttpResponse.json(mockPayCardLinkedWallets()),
  ),
]);

type CardAssetCurrency =
  NonNullable<CardDetailsProps["assets"]>["currencies"] extends ReadonlyMap<string, infer Currency>
    ? Currency
    : never;

const USDC = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd__coin",
  parentCurrencyId: "ethereum",
  contractAddress: "0x0000000000000000000000000000000000000000",
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
} as CardAssetCurrency;

const ASSETS: CardDetailsProps["assets"] = {
  currencies: new Map([[USDC.id, USDC]]),
  priceWallet: () => 1,
  formatCountervalue: () => "$1.00",
  formatBalance: value => ({
    integerPart: String(value),
    decimalPart: "00",
    currencyText: "$",
    decimalSeparator: ".",
    currencyPosition: "start",
  }),
};

const StoreWrapper = cardApiWrapper({ signedIn: true });

function Wrapper({ children }: PropsWithChildren) {
  return (
    <StoreWrapper>
      <I18nWrapper>{children}</I18nWrapper>
    </StoreWrapper>
  );
}

function renderCardDetails({
  onTrackEvent = jest.fn(),
  onTopUp,
}: {
  onTrackEvent?: jest.Mock;
  onTopUp?: () => void;
} = {}) {
  return {
    user: userEvent.setup(),
    onTrackEvent,
    ...render(<CardDetails onTrackEvent={onTrackEvent} onTopUp={onTopUp} />, { wrapper: Wrapper }),
  };
}

describe("CardDetails (native)", () => {
  it("should show the preview actions when the card details screen renders", () => {
    renderCardDetails({ onTopUp: jest.fn() });

    expect(screen.getByLabelText(CARD_COPY.topUp)).toBeVisible();
    expect(screen.getByLabelText(CARD_COPY.details)).toBeVisible();
  });

  it("should show no top up action when the host wires none", () => {
    renderCardDetails();

    expect(screen.queryByLabelText(CARD_COPY.topUp)).toBeNull();
    expect(screen.getByLabelText(CARD_COPY.details)).toBeVisible();
  });

  it("should open the top up from the card face", async () => {
    const onTopUp = jest.fn();
    const { user } = renderCardDetails({ onTopUp });

    await user.press(screen.getByLabelText(CARD_COPY.topUp));

    expect(onTopUp).toHaveBeenCalledTimes(1);
  });

  it("should offer the top up again at the bottom of the details sheet", async () => {
    const { user } = renderCardDetails({ onTopUp: jest.fn() });

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(await screen.findByText(CARD_COPY.freeze)).toBeVisible();
    expect(screen.getAllByLabelText(CARD_COPY.topUp)).toHaveLength(2);
  });

  it("should list the assets the host passes inside the sheet, under the card actions", async () => {
    const user = userEvent.setup();
    render(<CardDetails onTrackEvent={jest.fn()} assets={ASSETS} />, { wrapper: Wrapper });

    // The Pay tab shows the card face alone: the list belongs to the sheet the design draws.
    expect(screen.queryByText("Assets")).not.toBeOnTheScreen();

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(await screen.findByText("USD Coin")).toBeVisible();
  });

  it("should open asset details inside the card details drawer", async () => {
    const user = userEvent.setup();
    render(<CardDetails assets={ASSETS} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("USD Coin"));

    expect(screen.getByText("Top up")).toBeVisible();
    expect(screen.getByText("Withdraw")).toBeVisible();
    expect(screen.getAllByTestId("card-details-sheet")).toHaveLength(1);
  });

  it("should title the asset details in the sheet header, not in its body", async () => {
    const user = userEvent.setup();
    render(<CardDetails assets={ASSETS} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("USD Coin"));

    expect(
      screen.UNSAFE_getByProps({
        title: "USD Coin",
        description: "USDC",
      }),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("card-asset-details-drawer")).queryByText("USD Coin"),
    ).not.toBeOnTheScreen();
  });

  it("should return to the overview when leaving asset details through back", async () => {
    const user = userEvent.setup();
    render(<CardDetails assets={ASSETS} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("USD Coin"));
    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-asset-details-drawer")).not.toBeOnTheScreen();
  });

  it("should open Manage inside the card details drawer", async () => {
    const user = userEvent.setup();
    const onAddAsset = jest.fn();
    render(<CardDetails assets={{ ...ASSETS, onAddAsset }} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("Manage"));

    expect(screen.getByText("Manage assets")).toBeVisible();
    expect(screen.getByText("Add asset")).toBeVisible();
    expect(screen.getAllByTestId("card-details-sheet")).toHaveLength(1);

    await user.press(screen.getByText("Add asset"));
    expect(onAddAsset).toHaveBeenCalledTimes(1);
  });

  it("should return to the overview when leaving Manage assets through back", async () => {
    const user = userEvent.setup();
    render(<CardDetails assets={ASSETS} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("Manage"));
    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByText("Manage assets")).not.toBeOnTheScreen();
  });

  it("should navigate from asset details to Withdraw in the same drawer", async () => {
    const user = userEvent.setup();
    const onWithdraw = jest.fn();
    render(<CardDetails assets={{ ...ASSETS, onWithdraw }} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("USD Coin"));
    await user.press(screen.getByText("Withdraw"));

    expect(screen.getByText("You'll be redirected to Baanx")).toBeVisible();
    expect(screen.getByText("Continue")).toBeVisible();
    expect(screen.getAllByTestId("card-details-sheet")).toHaveLength(1);

    await user.press(screen.getByText("Continue"));
    expect(onWithdraw).toHaveBeenCalledWith(
      expect.objectContaining({ name: "USD Coin", currency: "usdc" }),
    );
  });

  it("should step back from Withdraw to the asset details it was opened from", async () => {
    const user = userEvent.setup();
    render(<CardDetails assets={ASSETS} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("USD Coin"));
    await user.press(screen.getByText("Withdraw"));
    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-asset-details-drawer")).toBeVisible();
    expect(screen.queryByTestId("card-asset-withdraw-drawer")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("card-details-overview")).not.toBeOnTheScreen();
    // The header still carries the asset it stepped back to, not an empty title slot.
    expect(screen.UNSAFE_getByProps({ title: "USD Coin", description: "USDC" })).toBeTruthy();

    await user.press(screen.getByTestId("card-details-sheet-back"));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
  });

  it("should request history for the selected asset when Transactions is pressed", async () => {
    const user = userEvent.setup();
    const onShowHistory = jest.fn();
    render(<CardDetails assets={{ ...ASSETS, onShowHistory }} />, { wrapper: Wrapper });

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("USD Coin"));
    await user.press(screen.getByText("Transactions"));

    expect(onShowHistory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "USD Coin", currency: "usdc" }),
    );
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
    render(<CardDetails onTrackEvent={jest.fn()} cardVisual={cardVisual} />, {
      wrapper: Wrapper,
    });

    await user.press(screen.getByLabelText(CARD_COPY.details));

    // One face in the tab, one in the sheet, and the balance is the same on both.
    const amounts = await screen.findAllByTestId("card-visual-amount");
    expect(amounts).toHaveLength(2);
    expect(amounts.map(amount => amount.props.value)).toEqual([2500, 2500]);
  });

  it("should keep the details sheet content hidden when Details has not been pressed", () => {
    renderCardDetails();

    expect(screen.queryByText(CARD_COPY.freeze)).not.toBeOnTheScreen();
  });

  it("should open the details sheet when Details is pressed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(screen.getByText(CARD_COPY.numbersReveal)).toBeVisible();
    expect(screen.getByText(CARD_COPY.freeze)).toBeVisible();
    expect(await screen.findByLabelText(MORE_COPY.tile)).toBeVisible();
  });

  it("should show the card numbers image after View", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText(CARD_COPY.numbersReveal));

    const image = await screen.findByLabelText(CARD_COPY.numbersImageAlt, {
      includeHiddenElements: true,
    });
    await act(() => {
      image.props.onLoad();
    });

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
    expect(screen.queryByTestId("card-details-more-content")).not.toBeOnTheScreen();
  });

  it("should reopen with overview content after More is dismissed immediately", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByLabelText(MORE_COPY.tile));
    await user.press(screen.getByTestId("card-details-sheet-dismiss"));
    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-more-content")).not.toBeOnTheScreen();
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
    expect(screen.queryByTestId("card-details-freeze-content")).not.toBeOnTheScreen();
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
    expect(screen.queryByTestId("card-details-transaction-content")).not.toBeOnTheScreen();
  });

  it("should reopen on the overview after transaction details are dismissed", async () => {
    const { user } = renderCardDetails();

    await user.press(screen.getByLabelText(CARD_COPY.details));
    await user.press(await screen.findByText("NETFLIX.COM"));
    await user.press(screen.getByTestId("card-details-sheet-dismiss"));
    await user.press(screen.getByLabelText(CARD_COPY.details));

    expect(screen.getByTestId("card-details-overview")).toBeVisible();
    expect(screen.queryByTestId("card-details-transaction-content")).not.toBeOnTheScreen();
  });
});
