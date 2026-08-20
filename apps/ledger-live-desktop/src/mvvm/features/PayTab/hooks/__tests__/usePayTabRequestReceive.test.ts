import type { Account, AccountLike } from "@ledgerhq/types-live";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { act, renderHook } from "tests/testSetup";
import { useOpenAssetAndAccount } from "../../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { deriveRequestReceiveData } from "../deriveRequestReceiveData";
import { usePayTabRequestReceive } from "../usePayTabRequestReceive";

jest.mock("../../../ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: jest.fn(),
}));
jest.mock("../deriveRequestReceiveData", () => ({ deriveRequestReceiveData: jest.fn() }));
jest.mock("../../../../hooks/useCopyToClipboard", () => ({
  useCopyToClipboard: () => jest.fn(),
}));

const mockedUseOpenAssetAndAccount = jest.mocked(useOpenAssetAndAccount);
const mockedDerive = jest.mocked(deriveRequestReceiveData);

const DERIVED = {
  address: "0xTokenParentAddress",
  asset: { name: "USD Coin", ticker: "USDC" },
  network: "Base",
  assetIcon: { ledgerId: "base/erc20/usd__coin", ticker: "USDC", network: "base" },
  networkIcon: { ledgerId: "base", ticker: "ETH" },
};

let openAssetAndAccount: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  openAssetAndAccount = jest.fn();
  mockedUseOpenAssetAndAccount.mockReturnValue({
    openAssetAndAccount,
    openAssetAndAccountPromise: jest.fn(),
  });
  mockedDerive.mockReturnValue(DERIVED);
});

const noop = () => {};

describe("usePayTabRequestReceive", () => {
  it("should start closed with empty display data", () => {
    const { result } = renderHook(() => usePayTabRequestReceive(undefined, noop));

    expect(result.current.requestReceive.isOpen).toBe(false);
    expect(result.current.requestReceive.address).toBe("");
    expect(result.current.requestReceive.asset).toEqual({ name: "", ticker: "" });
    expect(mockedDerive).not.toHaveBeenCalled();
  });

  it("should open MAD filtered to the stablecoin category", () => {
    const { result } = renderHook(() => usePayTabRequestReceive(undefined, noop));

    act(() => result.current.open());

    expect(openAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [AssetCategory.Stablecoins],
      }),
    );
  });

  it("should populate the dialog from the selected account on success", () => {
    const account = { type: "TokenAccount" } as unknown as AccountLike;
    const parentAccount = { type: "Account" } as unknown as Account;

    const { result } = renderHook(() => usePayTabRequestReceive(undefined, noop));

    act(() => result.current.open());
    const { onSuccess } = openAssetAndAccount.mock.calls[0][0];
    act(() => onSuccess(account, parentAccount));

    expect(mockedDerive).toHaveBeenCalledWith(account, parentAccount);
    const { requestReceive } = result.current;
    expect(requestReceive.isOpen).toBe(true);
    expect(requestReceive.address).toBe(DERIVED.address);
    expect(requestReceive.asset).toEqual(DERIVED.asset);
    expect(requestReceive.network).toBe(DERIVED.network);
    expect(requestReceive.assetIcon).toEqual(DERIVED.assetIcon);
    expect(requestReceive.networkIcon).toEqual(DERIVED.networkIcon);
  });

  it("should close the dialog through onClose", () => {
    const account = { type: "Account" } as unknown as AccountLike;
    const { result } = renderHook(() => usePayTabRequestReceive(undefined, noop));

    act(() => result.current.open());
    act(() => openAssetAndAccount.mock.calls[0][0].onSuccess(account, undefined));
    expect(result.current.requestReceive.isOpen).toBe(true);

    act(() => result.current.requestReceive.onClose());
    expect(result.current.requestReceive.isOpen).toBe(false);
  });

  it("should close the receive dialog and hand off to the injected verify callback", () => {
    const account = { type: "Account" } as unknown as AccountLike;
    const onVerify = jest.fn();
    const { result } = renderHook(() => usePayTabRequestReceive(undefined, onVerify));

    act(() => result.current.open());
    act(() => openAssetAndAccount.mock.calls[0][0].onSuccess(account, undefined));
    expect(result.current.requestReceive.isOpen).toBe(true);

    act(() => result.current.requestReceive.onVerify(DERIVED.address));

    expect(result.current.requestReceive.isOpen).toBe(false);
    expect(onVerify).toHaveBeenCalledWith(DERIVED.address);
  });
});
