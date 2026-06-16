import React from "react";
import { render, screen } from "tests/testSetup";
import { FallbackBanner } from "../index";
import { useTradeAvailability } from "LLD/features/AssetDetail/hooks/useTradeAvailability";

jest.mock("LLD/features/AssetDetail/hooks/useTradeAvailability");

const BANNER_TEST_ID = "asset-detail-fallback-banner";

const mockAvailability = (
  availableOnBuy: boolean,
  availableOnSwap: boolean,
  { isResolved = true, isCurrencySupported = true } = {},
) =>
  jest
    .mocked(useTradeAvailability)
    .mockReturnValue({ availableOnBuy, availableOnSwap, isCurrencySupported, isResolved });

describe("FallbackBanner", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders nothing when both buy and swap are available", () => {
    mockAvailability(true, true);
    render(<FallbackBanner ledgerIds={["bitcoin"]} showSkeleton={false} />);
    expect(screen.queryByTestId(BANNER_TEST_ID)).not.toBeInTheDocument();
  });

  it("renders nothing when only buy is available", () => {
    mockAvailability(true, false);
    render(<FallbackBanner ledgerIds={["bitcoin"]} showSkeleton={false} />);
    expect(screen.queryByTestId(BANNER_TEST_ID)).not.toBeInTheDocument();
  });

  it("renders nothing when only swap is available", () => {
    mockAvailability(false, true);
    render(<FallbackBanner ledgerIds={["bitcoin"]} showSkeleton={false} />);
    expect(screen.queryByTestId(BANNER_TEST_ID)).not.toBeInTheDocument();
  });

  it("renders the banner when both buy and swap are unavailable", () => {
    mockAvailability(false, false);
    render(<FallbackBanner ledgerIds={["bitcoin"]} showSkeleton={false} />);
    expect(screen.getByTestId(BANNER_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText("Swap and Buy are not supported for this asset.")).toBeInTheDocument();
  });

  it("renders nothing when the currency is not supported", () => {
    mockAvailability(false, false, { isCurrencySupported: false });
    render(<FallbackBanner ledgerIds={[]} showSkeleton={false} />);
    expect(screen.queryByTestId(BANNER_TEST_ID)).not.toBeInTheDocument();
  });

  it("renders nothing while the section is loading (skeleton)", () => {
    mockAvailability(false, false);
    render(<FallbackBanner ledgerIds={["bitcoin"]} showSkeleton={true} />);
    expect(screen.queryByTestId(BANNER_TEST_ID)).not.toBeInTheDocument();
  });

  it("renders nothing while availability is unresolved", () => {
    mockAvailability(false, false, { isResolved: false });
    render(<FallbackBanner ledgerIds={["bitcoin"]} showSkeleton={false} />);
    expect(screen.queryByTestId(BANNER_TEST_ID)).not.toBeInTheDocument();
  });
});
