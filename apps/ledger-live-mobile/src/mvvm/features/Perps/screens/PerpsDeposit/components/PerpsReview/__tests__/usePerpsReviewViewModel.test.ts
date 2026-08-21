import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike } from "@ledgerhq/types-live";
import { renderHook, waitFor } from "@tests/test-renderer";
import { usePerpsReviewViewModel, type PerpsReviewProps } from "../usePerpsReviewViewModel";

function createAccount(id: string, currencyId: string): AccountLike {
  return {
    type: "Account",
    id,
    currency: getCryptoCurrencyById(currencyId),
    spendableBalance: new BigNumber(0),
    balance: new BigNumber(0),
  } as AccountLike;
}

const depositAccount = createAccount("funding-1", "ethereum");
const receiverAccount = createAccount("receiver-1", "ethereum");

function createProps(overrides?: Partial<PerpsReviewProps>): PerpsReviewProps {
  return {
    depositAccount,
    receiverAccount,
    amountSent: "0.02",
    amountTo: "0.019",
    isOpen: true,
    onClose: jest.fn(),
    ...overrides,
  };
}

describe("usePerpsReviewViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("formats the sent amount in the funding currency", async () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createProps()));

    await waitFor(() => expect(result.current.swapDetails[0].value).not.toBe(""));
    expect(result.current.swapDetails[0].value).toMatch(/^0\.02[\s\u00A0]ETH$/);
  });

  it("formats the received amount in the receiving currency, as an estimate", async () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createProps()));

    await waitFor(() => expect(result.current.swapDetails[1].value).not.toBe(""));
    expect(result.current.swapDetails[1].value).toMatch(/^~0\.019[\s\u00A0]ETH$/);
  });

  it("shows the received amount and the receiver account in the deposit details", async () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createProps()));

    await waitFor(() => expect(result.current.depositDetails[0].value).not.toBe(""));
    expect(result.current.depositDetails[0].value).toMatch(/^~0\.019[\s\u00A0]ETH$/);
    expect(result.current.depositDetails[1].testID).toBe("perps-deposit-receiver-account");
  });

  it("mirrors the open state onto the drawer", () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createProps({ isOpen: false })));

    expect(result.current.drawerOpen).toBe(false);
  });

  it("closes the drawer when confirming the deposit", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsReviewViewModel(createProps({ onClose })));

    result.current.handleDeposit();

    expect(onClose).toHaveBeenCalled();
  });
});
