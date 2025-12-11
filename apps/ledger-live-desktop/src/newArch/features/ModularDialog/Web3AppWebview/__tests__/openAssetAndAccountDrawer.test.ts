import React from "react";
import { renderHook } from "tests/testSetup";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { useOpenAssetAndAccount } from "../AssetAndAccountDrawer";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";

jest.mock("LLD/components/Dialog", () => ({
  useDialog: jest.fn(),
}));

import { useDialog } from "LLD/components/Dialog";

const mockUseDialog = jest.mocked(useDialog);

const mockAccount = { id: "account1" } as AccountLike;
const mockParentAccount = { id: "parent1" } as Account;

const config = createModularDrawerConfiguration({});

describe("useOpenAssetAndAccount - openAssetAndAccount", () => {
  const openDialog = jest.fn();
  const closeDialog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDialog.mockReturnValue({ openDialog, closeDialog });
  });

  it("should handle callback mode success", () => {
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useOpenAssetAndAccount(true));

    result.current.openAssetAndAccount({
      onSuccess,
      drawerConfiguration: config,
    });

    expect(openDialog).toHaveBeenCalledTimes(1);
    const call = openDialog.mock.calls[0];
    const dialogContent = call[0];

    // Simulate account selection by finding the onAccountSelected handler in the dialog content
    // The dialog content is a ModularDialogFlowManager component
    const dialogProps = (dialogContent as React.ReactElement).props;
    if (dialogProps?.onAccountSelected) {
      dialogProps.onAccountSelected(mockAccount, mockParentAccount);
    }

    expect(closeDialog).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(mockAccount, mockParentAccount);
  });

  it("should handle callback mode cancel", () => {
    const onCancel = jest.fn();

    const { result } = renderHook(() => useOpenAssetAndAccount(true));

    result.current.openAssetAndAccount({
      onCancel,
      drawerConfiguration: config,
    });

    expect(openDialog).toHaveBeenCalledTimes(1);
    const call = openDialog.mock.calls[0];
    const onClose = call[1];

    // Simulate cancel by calling the onClose callback
    if (onClose) {
      onClose();
    }

    expect(onCancel).toHaveBeenCalled();
  });
});

describe("useOpenAssetAndAccount - openAssetAndAccountPromise", () => {
  const openDialog = jest.fn();
  const closeDialog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDialog.mockReturnValue({ openDialog, closeDialog });
  });

  it("should resolve with account and parentAccount on success", async () => {
    let onAccountSelectedHandler:
      | ((account: AccountLike, parentAccount?: Account) => void)
      | undefined;

    // Mock openDialog to capture the onAccountSelected handler
    openDialog.mockImplementation(content => {
      const dialogProps = (content as React.ReactElement).props;
      onAccountSelectedHandler = dialogProps?.onAccountSelected;
    });

    const { result } = renderHook(() => useOpenAssetAndAccount(true));

    const resultPromise = result.current.openAssetAndAccountPromise({
      drawerConfiguration: config,
    });

    // Simulate account selection after the promise is created
    if (onAccountSelectedHandler) {
      onAccountSelectedHandler(mockAccount, mockParentAccount);
    }

    const resultValue = await resultPromise;

    expect(resultValue).toEqual({ account: mockAccount, parentAccount: mockParentAccount });
    expect(openDialog).toHaveBeenCalled();
    expect(closeDialog).toHaveBeenCalled();
  });

  it("should reject with an error on cancel", async () => {
    let onCloseHandler: (() => void) | undefined;

    // Mock openDialog to capture the onClose handler
    openDialog.mockImplementation((content, onClose) => {
      onCloseHandler = onClose;
    });

    const { result } = renderHook(() => useOpenAssetAndAccount(true));

    const resultPromise = result.current.openAssetAndAccountPromise({
      drawerConfiguration: config,
    });

    // Simulate cancellation by calling onClose
    if (onCloseHandler) {
      onCloseHandler();
    }

    await expect(resultPromise).rejects.toThrow("Canceled by user");
  });
});
