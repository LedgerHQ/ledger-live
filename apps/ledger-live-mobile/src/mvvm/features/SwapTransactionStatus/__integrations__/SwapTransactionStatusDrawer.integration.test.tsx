import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { render, screen, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useSwapTransactionStatusViewModel } from "../hooks/useSwapTransactionStatusViewModel";
import { SwapTransactionStatusDrawerWrapper } from "../components/SwapTransactionStatusDrawerWrapper";

jest.mock("../hooks/useSwapTransactionStatusViewModel", () => ({
  useSwapTransactionStatusViewModel: jest.fn(),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const mockedUseSwapTransactionStatusViewModel = jest.mocked(useSwapTransactionStatusViewModel);

function withSwapTransactionStatusDrawerOpen(state: State): State {
  return {
    ...state,
    swapTransactionStatusDrawer: {
      isOpen: true,
      params: {
        provider: "lifi",
        swapId: "swap-1",
      },
    },
  };
}

describe("SwapTransactionStatusDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSwapTransactionStatusViewModel.mockReturnValue({
      sendCurrency: bitcoin,
      receiveCurrency: ethereum,
      receiveAccountCurrency: ethereum,
      createdAt: new Date("2024-01-02T15:04:00.000Z").getTime(),
      locale: "en-US",
      sendStatus: "finished",
      receiveStatus: "finished",
      sentAmount: "0.1 BTC",
      receivedAmount: "2 ETH",
      showReceivedAmountEstimated: true,
      feesAmount: "0.0001 BTC",
      receiveAccountName: "Ethereum 1",
      provider: "lifi",
      providerData: undefined,
      swapId: "swap-1",
      explorerUrl: "https://scan.li.fi/tx/hash-1",
      isStatusSectionLoading: false,
      isFooterLoading: false,
    });
  });

  it("should not mount drawer body while closed", () => {
    render(<SwapTransactionStatusDrawerWrapper />);

    expect(screen.queryByText("Swap BTC → ETH")).toBeNull();
    expect(mockedUseSwapTransactionStatusViewModel).not.toHaveBeenCalled();
  });

  it("should render and close the drawer from the header close action", async () => {
    const { store, user } = render(<SwapTransactionStatusDrawerWrapper />, {
      overrideInitialState: withSwapTransactionStatusDrawerOpen,
    });

    expect(await screen.findByText("Swap BTC → ETH")).toBeOnTheScreen();
    expect(screen.getByText("(Estimated)")).toBeVisible();
    expect(mockedUseSwapTransactionStatusViewModel).toHaveBeenCalledWith({
      params: { provider: "lifi", swapId: "swap-1" },
      onClose: expect.any(Function),
    });

    await user.press(screen.getByLabelText("Close"));

    await waitFor(() => {
      expect(store.getState().swapTransactionStatusDrawer).toEqual({
        isOpen: false,
        params: null,
      });
    });
    expect(screen.queryByText("Swap BTC → ETH")).toBeNull();
  });
});
