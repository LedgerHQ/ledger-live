import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { ExchangeSwap } from "@ledgerhq/live-common/exchange/swap/types";
import { render, screen, waitFor } from "tests/testSetup";
import { useDispatch } from "LLD/hooks/redux";
import { openSwapTransactionStatusDialog } from "LLD/features/SwapTransactionStatusDialog/swapTransactionStatusDialog";
import { useRedirectToSwapHistory } from "~/renderer/screens/exchange/Swap2/utils";
import Body, { type Data } from "./Body";
import type { BodyContentProps } from "./BodyContent";

jest.mock("LLD/hooks/redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(() => false),
}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => jest.fn(),
}));
jest.mock("~/renderer/screens/exchange/Swap2/utils", () => ({
  useRedirectToSwapHistory: jest.fn(),
}));
jest.mock("LLD/features/SwapTransactionStatusDialog/swapTransactionStatusDialog", () => ({
  openSwapTransactionStatusDialog: jest.fn(payload => ({
    type: "swapTransactionStatusDialog/openSwapTransactionStatusDialog",
    payload,
  })),
}));
jest.mock("./BodyContent", () => ({
  BodyContent: ({ onViewDetails }: BodyContentProps) => (
    <button type="button" onClick={() => onViewDetails("swap-1")}>
      View details
    </button>
  ),
}));

const mockedUseDispatch = jest.mocked(useDispatch);
const mockedUseRedirectToSwapHistory = jest.mocked(useRedirectToSwapHistory);

describe("CompleteExchange Body", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should close the exchange drawer and open the swap transaction status dialog", async () => {
    const dispatch = jest.fn();
    const onClose = jest.fn();
    const redirectToHistory = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatch);
    mockedUseRedirectToSwapHistory.mockReturnValue(redirectToHistory);
    const currency = getCryptoCurrencyById("bitcoin");
    const account = genAccount("bitcoin-swap-account", { currency });
    const data: Data = {
      provider: "lifi",
      exchange: {
        fromAccount: account,
        fromParentAccount: undefined,
        fromCurrency: currency,
        toAccount: account,
        toCurrency: currency,
      } as ExchangeSwap,
      transaction: {} as Transaction,
      binaryPayload: "binary-payload",
      signature: "signature",
      onResult: jest.fn(),
      onCancel: jest.fn(),
      exchangeType: ExchangeType.SWAP,
      swapId: "swap-1",
      magnitudeAwareRate: account.balance,
      refundAddress: "refund-address",
      payoutAddress: "payout-address",
    };
    const { user } = render(<Body data={data} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "View details" }));

    expect(onClose).toHaveBeenCalledWith({ shouldRestoreFocusOnClose: false });
    await waitFor(() => {
      expect(redirectToHistory).toHaveBeenCalledWith({ swapId: "swap-1" });
      expect(dispatch).toHaveBeenCalledWith(
        openSwapTransactionStatusDialog({
          swapId: "swap-1",
          provider: "lifi",
        }),
      );
    });
  });
});
