import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
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
  BodyContent: ({ onViewDetails, onError, error, isRetryPending }: BodyContentProps) => (
    <>
      <button type="button" onClick={() => onViewDetails("swap-1")}>
        View details
      </button>
      <button type="button" onClick={() => onError(mockSignatureError)}>
        Reject signature
      </button>
      {isRetryPending ? <p>Retry pending</p> : error && <p>{error.message}</p>}
    </>
  ),
}));

const mockSignatureError = new CompleteExchangeError(
  "CHECK_TRANSACTION_SIGNATURE",
  "signVerificationFail",
  "Signature verification failed",
);

const mockedUseDispatch = jest.mocked(useDispatch);
const mockedUseRedirectToSwapHistory = jest.mocked(useRedirectToSwapHistory);

const buildData = (overrides: Partial<Data> = {}): Data => {
  const currency = getCryptoCurrencyById("bitcoin");
  const account = genAccount("bitcoin-swap-account", { currency });
  return {
    provider: "lifi",
    exchange: {
      fromAccount: account,
      fromParentAccount: undefined,
      fromCurrency: currency,
      toAccount: account,
      toParentAccount: undefined,
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
    ...overrides,
  };
};

describe("CompleteExchange Body", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDispatch.mockReturnValue(jest.fn());
    mockedUseRedirectToSwapHistory.mockReturnValue(jest.fn());
  });

  it("should close the exchange drawer and open the swap transaction status dialog", async () => {
    const dispatch = jest.fn();
    const onClose = jest.fn();
    const redirectToHistory = jest.fn();
    mockedUseDispatch.mockReturnValue(dispatch);
    mockedUseRedirectToSwapHistory.mockReturnValue(redirectToHistory);
    const { user } = render(<Body data={buildData()} onClose={onClose} />);

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

  it("should hide the signature error and cancel the attempt when the swap will be retried", async () => {
    const data = buildData({ willRetryOnSignatureError: true });
    const { user } = render(<Body data={data} />);

    await user.click(screen.getByRole("button", { name: "Reject signature" }));

    expect(screen.getByText("Retry pending")).toBeVisible();
    expect(screen.queryByText("Signature verification failed")).not.toBeInTheDocument();
    expect(data.onCancel).toHaveBeenCalledWith(mockSignatureError);
  });

  it("should display the signature error when no retry is left", async () => {
    const data = buildData({ willRetryOnSignatureError: false });
    const { user } = render(<Body data={data} />);

    await user.click(screen.getByRole("button", { name: "Reject signature" }));

    expect(screen.getByText("Signature verification failed")).toBeVisible();
    expect(screen.queryByText("Retry pending")).not.toBeInTheDocument();
    expect(data.onCancel).toHaveBeenCalledWith(mockSignatureError);
  });
});
