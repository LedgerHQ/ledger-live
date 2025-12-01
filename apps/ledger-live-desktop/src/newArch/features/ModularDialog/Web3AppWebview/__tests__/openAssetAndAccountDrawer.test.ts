import { setDialog } from "~/renderer/dialogs/Provider";
import { Account, AccountLike } from "@ledgerhq/types-live";
import {
  openAssetAndAccountDrawer,
  openAssetAndAccountDrawerPromise,
} from "../AssetAndAccountDrawer";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";

jest.mock("../../ModularDrawerFlowManager", () => {
  return ({ children }: { children: React.ReactNode }) => children;
});

jest.mock("~/renderer/dialogs/Provider", () => ({
  setDialog: jest.fn(),
}));

const mockAccount = { id: "account1" } as AccountLike;
const mockParentAccount = { id: "parent1" } as Account;

const config = createModularDrawerConfiguration({});

describe("openAssetAndAccountDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock setDialog to simulate the behavior of onAccountSelected
    (setDialog as jest.Mock).mockImplementation((_Component, props, options) => {
      if (props?.onAccountSelected) {
        props.onAccountSelected(mockAccount, mockParentAccount);
      }
      if (options?.onClose) {
        options.onClose();
      }
    });
  });

  it("should handle callback mode success", () => {
    const onSuccess = jest.fn();
    openAssetAndAccountDrawer({
      onSuccess,
      drawerConfiguration: config,
    });

    const call = (setDialog as jest.Mock).mock.calls[0];
    const onAccountSelected = call[1].onAccountSelected;

    onAccountSelected(mockAccount, mockParentAccount);

    expect(onSuccess).toHaveBeenCalledWith(mockAccount, mockParentAccount);
  });

  it("should handle callback mode cancel", () => {
    const onCancel = jest.fn();

    openAssetAndAccountDrawer({
      onCancel,
      drawerConfiguration: config,
    });

    const call = (setDialog as jest.Mock).mock.calls[0];
    const onClose = call[2].onClose;

    onClose();

    expect(onCancel).toHaveBeenCalled();
  });
});

describe("openAssetAndAccountDrawerPromise", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock setDialog to simulate the behavior of onAccountSelected and onClose
    (setDialog as jest.Mock).mockImplementation((_Component, props, options) => {
      if (props?.onAccountSelected) {
        props.onAccountSelected(mockAccount, mockParentAccount);
      }
      if (options?.onClose) {
        options.onClose();
      }
    });
  });

  it("should resolve with account and parentAccount on success", async () => {
    const result = await openAssetAndAccountDrawerPromise({
      drawerConfiguration: config,
    });

    expect(result).toEqual({ account: mockAccount, parentAccount: mockParentAccount });
    expect(setDialog).toHaveBeenCalled();
  });

  it("should reject with an error on cancel", async () => {
    // Simulate cancellation by triggering onClose
    (setDialog as jest.Mock).mockImplementation((_Component, _props, options) => {
      if (options?.onClose) {
        options.onClose();
      }
    });

    await expect(
      openAssetAndAccountDrawerPromise({
        drawerConfiguration: config,
      }),
    ).rejects.toThrow("Canceled by user");
  });
});
