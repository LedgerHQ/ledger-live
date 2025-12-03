import React from "react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import {
  openAssetAndAccountDialog,
  openAssetAndAccountDialogPromise,
} from "../AssetAndAccountDrawer";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";
import * as DialogModule from "LLD/components/Dialog";

jest.mock("../../ModularDialogFlowManager", () => {
  return ({ children }: { children: React.ReactNode }) => children;
});

jest.mock("../../components/CloseButton", () => ({
  CloseButton: () => null,
}));

jest.mock("LLD/components/Dialog", () => ({
  openDialog: jest.fn(),
  closeDialog: jest.fn(),
}));

const mockAccount = { id: "account1" } as AccountLike;
const mockParentAccount = { id: "parent1" } as Account;

const config = createModularDrawerConfiguration({});

describe("openAssetAndAccountDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle callback mode success", () => {
    const onSuccess = jest.fn();
    openAssetAndAccountDialog({
      onSuccess,
      drawerConfiguration: config,
    });

    expect(DialogModule.openDialog).toHaveBeenCalledTimes(1);
    const call = (DialogModule.openDialog as jest.Mock).mock.calls[0];
    const dialogContent = call[0];

    // Simulate account selection by finding the onAccountSelected handler in the dialog content
    // The dialog content is a ModularDialogFlowManager component
    const dialogProps = (dialogContent as React.ReactElement).props;
    if (dialogProps?.onAccountSelected) {
      dialogProps.onAccountSelected(mockAccount, mockParentAccount);
    }

    expect(onSuccess).toHaveBeenCalledWith(mockAccount, mockParentAccount);
  });

  it("should handle callback mode cancel", () => {
    const onCancel = jest.fn();

    openAssetAndAccountDialog({
      onCancel,
      drawerConfiguration: config,
    });

    expect(DialogModule.openDialog).toHaveBeenCalledTimes(1);
    const call = (DialogModule.openDialog as jest.Mock).mock.calls[0];
    const onClose = call[1];

    // Simulate cancel by calling the onClose callback
    if (onClose) {
      onClose();
    }

    expect(onCancel).toHaveBeenCalled();
  });
});

describe("openAssetAndAccountDialogPromise", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve with account and parentAccount on success", async () => {
    let onAccountSelectedHandler:
      | ((account: AccountLike, parentAccount?: Account) => void)
      | undefined;

    // Mock openDialog to capture the onAccountSelected handler
    (DialogModule.openDialog as jest.Mock).mockImplementation(content => {
      const dialogProps = (content as React.ReactElement).props;
      onAccountSelectedHandler = dialogProps?.onAccountSelected;
    });

    const resultPromise = openAssetAndAccountDialogPromise({
      drawerConfiguration: config,
    });

    // Simulate account selection after the promise is created
    if (onAccountSelectedHandler) {
      onAccountSelectedHandler(mockAccount, mockParentAccount);
    }

    const result = await resultPromise;

    expect(result).toEqual({ account: mockAccount, parentAccount: mockParentAccount });
    expect(DialogModule.openDialog).toHaveBeenCalled();
    expect(DialogModule.closeDialog).toHaveBeenCalled();
  });

  it("should reject with an error on cancel", async () => {
    let onCloseHandler: (() => void) | undefined;

    // Mock openDialog to capture the onClose handler
    (DialogModule.openDialog as jest.Mock).mockImplementation((content, onClose) => {
      onCloseHandler = onClose;
    });

    const resultPromise = openAssetAndAccountDialogPromise({
      drawerConfiguration: config,
    });

    // Simulate cancellation by calling onClose
    if (onCloseHandler) {
      onCloseHandler();
    }

    await expect(resultPromise).rejects.toThrow("Canceled by user");
  });
});
