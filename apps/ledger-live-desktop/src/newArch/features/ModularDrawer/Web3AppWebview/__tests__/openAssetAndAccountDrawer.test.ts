import { setDrawer } from "~/renderer/drawers/Provider";
import { Account, AccountLike } from "@ledgerhq/types-live";
import {
  openAssetAndAccountDrawer,
  openAssetAndAccountDrawerPromise,
} from "../AssetAndAccountDrawer";

jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: jest.fn(),
}));

const mockAccount = { id: "account1" } as AccountLike;
const mockParentAccount = { id: "parent1" } as Account;

describe("openAssetAndAccountDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock setDrawer to simulate the behavior of onAccountSelected
    (setDrawer as jest.Mock).mockImplementation((_Component, props, options) => {
      if (props?.onAccountSelected) {
        props.onAccountSelected(mockAccount, mockParentAccount);
      }
      if (options?.onRequestClose) {
        options.onRequestClose();
      }
    });
  });

  it("should handle callback mode success", () => {
    const onSuccess = jest.fn();
    openAssetAndAccountDrawer({
      onSuccess,
      source: "testSource",
      flow: "testFlow",
    });

    const call = (setDrawer as jest.Mock).mock.calls[0];
    const onAccountSelected = call[1].onAccountSelected;

    onAccountSelected(mockAccount, mockParentAccount);

    expect(onSuccess).toHaveBeenCalledWith(mockAccount, mockParentAccount);
  });

  it("should handle callback mode cancel", () => {
    const onCancel = jest.fn();

    openAssetAndAccountDrawer({
      onCancel,
      source: "testSource",
      flow: "testFlow",
    });

    const call = (setDrawer as jest.Mock).mock.calls[0];
    const onRequestClose = call[2].onRequestClose;

    onRequestClose();

    expect(onCancel).toHaveBeenCalled();
  });
});

describe("openAssetAndAccountDrawerPromise", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock setDrawer to simulate the behavior of onAccountSelected and onRequestClose
    (setDrawer as jest.Mock).mockImplementation((_Component, props, options) => {
      if (props?.onAccountSelected) {
        props.onAccountSelected(mockAccount, mockParentAccount);
      }
      if (options?.onRequestClose) {
        options.onRequestClose();
      }
    });
  });

  it("should resolve with account and parentAccount on success", async () => {
    const result = await openAssetAndAccountDrawerPromise({
      source: "testSource",
      flow: "testFlow",
    });

    expect(result).toEqual({ account: mockAccount, parentAccount: mockParentAccount });
    expect(setDrawer).toHaveBeenCalled();
  });

  it("should reject with an error on cancel", async () => {
    // Simulate cancellation by triggering onRequestClose
    (setDrawer as jest.Mock).mockImplementation((_Component, _props, options) => {
      if (options?.onRequestClose) {
        options.onRequestClose();
      }
    });

    await expect(
      openAssetAndAccountDrawerPromise({
        source: "testSource",
        flow: "testFlow",
      }),
    ).rejects.toThrow("Canceled by user");
  });
});
