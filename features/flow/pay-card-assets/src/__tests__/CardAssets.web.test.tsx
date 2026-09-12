import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { CARD_ASSETS_COPY, I18nWrapper } from "./i18nWrapper";
import { CardAssets } from "../CardAssets";

const mockUseIsCardSignedIn = jest.fn();
const mockUseCardLinkedWallets = jest.fn();

jest.mock("@features/flow-pay-card-auth", () => ({
  useIsCardSignedIn: () => mockUseIsCardSignedIn(),
}));

jest.mock("@features/flow-pay-card-wallets", () => ({
  useCardLinkedWallets: (...args: unknown[]) => mockUseCardLinkedWallets(...args),
}));

function stubWallets(
  overrides: Partial<{
    wallets: readonly { id: string; balance: string | null; currency: string }[];
    isLoading: boolean;
    isError: boolean;
  }> = {},
) {
  mockUseCardLinkedWallets.mockReturnValue({
    wallets: [],
    isLoading: false,
    isError: false,
    isFetching: false,
    total: 0,
    isPartialTotal: false,
    refetch: jest.fn(),
    ...overrides,
  });
}

function renderCardAssets() {
  return render(<CardAssets />, { wrapper: I18nWrapper });
}

describe("CardAssets (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsCardSignedIn.mockReturnValue(true);
    stubWallets();
  });

  afterEach(() => {
    cleanup();
  });

  it("should hide the Assets section while signed out", () => {
    mockUseIsCardSignedIn.mockReturnValue(false);

    const { container } = renderCardAssets();

    expect(container).toBeEmptyDOMElement();
    expect(mockUseCardLinkedWallets).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it("should list wallet crypto amounts once signed in", () => {
    stubWallets({
      wallets: [
        { id: "w-usdc", balance: "125.40", currency: "usdc" },
        { id: "w-usdt", balance: null, currency: "usdt" },
      ],
    });

    renderCardAssets();

    expect(screen.getByText(CARD_ASSETS_COPY.title)).toBeVisible();
    expect(screen.getByText("125.40 USDC")).toBeVisible();
    expect(screen.getByText("USDT")).toBeVisible();
  });
});
