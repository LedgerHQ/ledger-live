import { renderHook, act } from "@testing-library/react-native";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { useOnDemandCurrencyCountervalues } from "../useOnDemandCountervalues";
import { useTrackingPairs, addExtraSessionTrackingPair } from "~/actions/general";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";

jest.mock("~/actions/general", () => ({
  useTrackingPairs: jest.fn(),
  addExtraSessionTrackingPair: jest.fn(),
}));

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  useCountervaluesPolling: jest.fn(),
}));

const btc = { id: "bitcoin" } as unknown as Currency;
const usd = { ticker: "USD" } as unknown as Currency;
const poll = jest.fn();

describe("useOnDemandCurrencyCountervalues", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useCountervaluesPolling as jest.Mock).mockReturnValue({ poll });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("registers the missing pair and polls after the delay", () => {
    (useTrackingPairs as jest.Mock).mockReturnValue([]);

    renderHook(() => useOnDemandCurrencyCountervalues(btc, usd));

    expect(addExtraSessionTrackingPair).toHaveBeenCalledWith({
      from: btc,
      to: usd,
      startDate: expect.any(Date),
    });
    expect(poll).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(poll).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the pair is already tracked", () => {
    (useTrackingPairs as jest.Mock).mockReturnValue([{ from: btc, to: usd }]);

    renderHook(() => useOnDemandCurrencyCountervalues(btc, usd));

    expect(addExtraSessionTrackingPair).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(poll).not.toHaveBeenCalled();
  });

  it("still polls when the pair appears right after registration", () => {
    (useTrackingPairs as jest.Mock).mockReturnValue([]);

    const { rerender } = renderHook(() => useOnDemandCurrencyCountervalues(btc, usd));

    // Registering the pair flips useTrackingPairs to include it and re-renders.
    (useTrackingPairs as jest.Mock).mockReturnValue([{ from: btc, to: usd }]);
    rerender({});

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(poll).toHaveBeenCalledTimes(1);
  });
});
