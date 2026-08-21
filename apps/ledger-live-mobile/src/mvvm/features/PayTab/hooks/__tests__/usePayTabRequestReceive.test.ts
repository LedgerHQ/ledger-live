import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { act, renderHook } from "@tests/test-renderer";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { deriveRequestReceiveData } from "../deriveRequestReceiveData";
import { usePayTabRequestReceive } from "../usePayTabRequestReceive";

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: jest.fn(),
}));
jest.mock("../deriveRequestReceiveData", () => ({ deriveRequestReceiveData: jest.fn() }));

const mockedUseModularDrawerController = jest.mocked(useModularDrawerController);
const mockedDerive = jest.mocked(deriveRequestReceiveData);

const DERIVED = {
  address: "0xTokenParentAddress",
  asset: { name: "USD Coin", ticker: "USDC" },
  network: "Base",
  assetIcon: { ledgerId: "base/erc20/usd__coin", ticker: "USDC", network: "base" },
  networkIcon: { ledgerId: "base", ticker: "ETH" },
};

let openDrawer: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  openDrawer = jest.fn();
  mockedUseModularDrawerController.mockReturnValue({
    openDrawer,
  } as unknown as ReturnType<typeof useModularDrawerController>);
  mockedDerive.mockReturnValue(DERIVED);
});

describe("usePayTabRequestReceive", () => {
  it("should start closed with empty display data", () => {
    const { result } = renderHook(() => usePayTabRequestReceive(undefined));

    expect(result.current.requestReceive.isOpen).toBe(false);
    expect(result.current.requestReceive.address).toBe("");
    expect(result.current.requestReceive.asset).toEqual({ name: "", ticker: "" });
    expect(mockedDerive).not.toHaveBeenCalled();
  });

  it("should open MAD filtered to the stablecoin category with account selection enabled", () => {
    const { result } = renderHook(() => usePayTabRequestReceive(undefined));

    act(() => result.current.open());

    expect(openDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [AssetCategory.Stablecoins],
        enableAccountSelection: true,
        flow: "request",
        source: "Pay",
      }),
    );
  });

  it("should populate the receive screen from the selected account on success", () => {
    const account = { type: "TokenAccount" } as unknown as AccountLike;
    const parentAccount = { type: "Account" } as unknown as Account;

    const { result } = renderHook(() => usePayTabRequestReceive(undefined));

    act(() => result.current.open());
    const { onAccountSelected } = openDrawer.mock.calls[0][0];
    act(() => onAccountSelected(account, parentAccount));

    expect(mockedDerive).toHaveBeenCalledWith(account, parentAccount);
    const { requestReceive } = result.current;
    expect(requestReceive.isOpen).toBe(true);
    expect(requestReceive.address).toBe(DERIVED.address);
    expect(requestReceive.asset).toEqual(DERIVED.asset);
    expect(requestReceive.network).toBe(DERIVED.network);
    expect(requestReceive.assetIcon).toEqual(DERIVED.assetIcon);
    expect(requestReceive.networkIcon).toEqual(DERIVED.networkIcon);
  });

  it("should close the receive screen through onClose", () => {
    const account = { type: "Account" } as unknown as AccountLike;
    const { result } = renderHook(() => usePayTabRequestReceive(undefined));

    act(() => result.current.open());
    act(() => openDrawer.mock.calls[0][0].onAccountSelected(account, undefined));
    expect(result.current.requestReceive.isOpen).toBe(true);

    act(() => result.current.requestReceive.onClose());
    expect(result.current.requestReceive.isOpen).toBe(false);
  });
});
