import React from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import {
  openAssetAndAccountDialog,
  openAssetAndAccountDialogPromise,
} from "../AssetAndAccountDrawer";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";

jest.mock("../../ModularDialogFlowManager", () => {
  return ({ children }: { children: React.ReactNode }) => children;
});

const mockAccount = { id: "account1" } as AccountLike;
const mockParentAccount = { id: "parent1" } as Account;

const config = createModularDrawerConfiguration({});

describe("openAssetAndAccountDialog", () => {
  const openDialog = jest.fn();
  const closeDialog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle callback mode success", () => {
    const onSuccess = jest.fn();
    openAssetAndAccountDialog({
      onSuccess,
      drawerConfiguration: config,
      openDialog,
      closeDialog,
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

    openAssetAndAccountDialog({
      onCancel,
      drawerConfiguration: config,
      openDialog,
      closeDialog,
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

describe("openAssetAndAccountDialogPromise", () => {
  const openDialog = jest.fn();
  const closeDialog = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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

    const resultPromise = openAssetAndAccountDialogPromise({
      drawerConfiguration: config,
      openDialog,
      closeDialog,
    });

    // Simulate account selection after the promise is created
    if (onAccountSelectedHandler) {
      onAccountSelectedHandler(mockAccount, mockParentAccount);
    }

    const result = await resultPromise;

    expect(result).toEqual({ account: mockAccount, parentAccount: mockParentAccount });
    expect(openDialog).toHaveBeenCalled();
    expect(closeDialog).toHaveBeenCalled();
  });

  it("should reject with an error on cancel", async () => {
    let onCloseHandler: (() => void) | undefined;

    // Mock openDialog to capture the onClose handler
    openDialog.mockImplementation((content, onClose) => {
      onCloseHandler = onClose;
    });

    const resultPromise = openAssetAndAccountDialogPromise({
      drawerConfiguration: config,
      openDialog,
      closeDialog,
    });

    // Simulate cancellation by calling onClose
    if (onCloseHandler) {
      onCloseHandler();
    }

    await expect(resultPromise).rejects.toThrow("Canceled by user");
  });
});
