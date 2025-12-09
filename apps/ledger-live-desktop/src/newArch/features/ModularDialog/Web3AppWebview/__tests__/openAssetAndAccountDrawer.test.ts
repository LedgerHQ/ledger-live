import { renderHook } from "tests/testSetup";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useOpenAssetAndAccount } from "../AssetAndAccountDrawer";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";

const mockAccount = { id: "account1" } as AccountLike;
const mockParentAccount = { id: "parent1" } as Account;

const config = createModularDrawerConfiguration({});

describe("useOpenAssetAndAccount - openAssetAndAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set isOpen on openAssetAndAccount", () => {
    const { result, store } = renderHook(() => useOpenAssetAndAccount(true));

    expect(store.getState().modularDrawer.isOpen).toBe(false);

    result.current.openAssetAndAccount({ drawerConfiguration: config });

    expect(store.getState().modularDrawer.isOpen).toBe(true);
  });

  it("should handle callback mode success", () => {
    const onSuccess = jest.fn();

    const { result, store } = renderHook(() => useOpenAssetAndAccount(true));

    result.current.openAssetAndAccount({
      onSuccess,
      drawerConfiguration: config,
    });

    store
      .getState()
      .modularDrawer.dialogParams?.onAccountSelected?.(mockAccount, mockParentAccount);

    expect(onSuccess).toHaveBeenCalledWith(mockAccount, mockParentAccount);
    expect(store.getState().modularDrawer.isOpen).toBe(false);
  });

  it("should handle callback mode cancel", () => {
    const onCancel = jest.fn();

    const { result, store } = renderHook(() => useOpenAssetAndAccount(true));

    result.current.openAssetAndAccount({
      onCancel,
      drawerConfiguration: config,
    });

    store.getState().modularDrawer.dialogParams?.onClose?.();

    expect(onCancel).toHaveBeenCalled();
    expect(store.getState().modularDrawer.isOpen).toBe(false);
  });
});

describe("useOpenAssetAndAccount - openAssetAndAccountPromise", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve with account and parentAccount on success", async () => {
    const { result, store } = renderHook(() => useOpenAssetAndAccount(true));

    const resultPromise = result.current.openAssetAndAccountPromise({
      drawerConfiguration: config,
    });

    store
      .getState()
      .modularDrawer.dialogParams?.onAccountSelected?.(mockAccount, mockParentAccount);

    const resultValue = await resultPromise;

    expect(resultValue).toEqual({ account: mockAccount, parentAccount: mockParentAccount });
    expect(store.getState().modularDrawer.isOpen).toBe(false);
  });

  it("should reject with an error on cancel", async () => {
    const { result, store } = renderHook(() => useOpenAssetAndAccount(true));

    const resultPromise = result.current.openAssetAndAccountPromise({
      drawerConfiguration: config,
    });

    store.getState().modularDrawer.dialogParams?.onClose?.();

    await expect(resultPromise).rejects.toThrow("Canceled by user");
    expect(store.getState().modularDrawer.isOpen).toBe(false);
  });
});
