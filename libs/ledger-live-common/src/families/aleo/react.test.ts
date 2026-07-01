/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useAleoViewKeyApproval, buildAccountsWithViewKeys } from "./react";

const mockCreateAction = jest.fn();
const mockUseHook = jest.fn();
const mockMapResult = jest.fn();
const mockConnectApp = jest.fn();

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(() => ({ enabled: false })),
}));

jest.mock("./hw/getViewKey/index", () => ({
  createAction: (...args: unknown[]) => mockCreateAction(...args),
  getViewKeyExec: jest.fn(),
}));

jest.mock("../../hw/connectApp", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockConnectApp(...args),
}));

jest.mock("./utils", () => ({
  patchAccountWithViewKey: jest.fn((account: Account, viewKey: string) => ({
    ...account,
    id: `${account.id}:patched:${viewKey}`,
  })),
}));

const { useFeature } = jest.requireMock("@features/platform-feature-flags");
const { getViewKeyExec } = jest.requireMock("./hw/getViewKey/index");

const mockDevice = { deviceId: "test-device" } as never;
const mockCurrency = { id: "aleo", type: "CryptoCurrency" } as CryptoCurrency;
const mockAccount1 = { id: "acc1", freshAddress: "addr1" } as Account;
const mockAccount2 = { id: "acc2", freshAddress: "addr2" } as Account;

const mockHookState = {
  sharePending: false,
  shareProgress: { completed: 0, total: 0, viewKeys: {} },
};

describe("useAleoViewKeyApproval", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHook.mockReturnValue(mockHookState);
    mockMapResult.mockReturnValue(null);
    mockCreateAction.mockReturnValue({ useHook: mockUseHook, mapResult: mockMapResult });
  });

  it("creates action with connectApp when ldmkConnectApp is disabled", () => {
    useFeature.mockReturnValue({ enabled: false });
    const mockExec = jest.fn();
    mockConnectApp.mockReturnValue(mockExec);

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
      }),
    );

    expect(mockConnectApp).toHaveBeenCalledWith({ isLdmkConnectAppEnabled: false });
    expect(mockCreateAction).toHaveBeenCalledWith(mockExec, getViewKeyExec);
  });

  it("creates action with ldmk connectApp when ldmkConnectApp is enabled", () => {
    useFeature.mockReturnValue({ enabled: true });
    const mockExec = jest.fn();
    mockConnectApp.mockReturnValue(mockExec);

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
      }),
    );

    expect(mockConnectApp).toHaveBeenCalledWith({ isLdmkConnectAppEnabled: true });
  });

  it("uses provided connectAppExec override instead of default", () => {
    const customExec = jest.fn();

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
        connectAppExec: customExec,
      }),
    );

    expect(mockCreateAction).toHaveBeenCalledWith(customExec, getViewKeyExec);
    expect(mockConnectApp).not.toHaveBeenCalled();
  });

  it("uses provided viewKeyExec override instead of default", () => {
    const customConnectExec = jest.fn();
    const customViewKeyExec = jest.fn();

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
        connectAppExec: customConnectExec,
        viewKeyExec: customViewKeyExec,
      }),
    );

    expect(mockCreateAction).toHaveBeenCalledWith(customConnectExec, customViewKeyExec);
    expect(mockConnectApp).not.toHaveBeenCalled();
  });

  it("correctly partitions confirmedAccountIds and rejectedAccountIds", () => {
    mockUseHook.mockReturnValue({
      ...mockHookState,
      shareProgress: {
        completed: 2,
        total: 2,
        viewKeys: { acc1: "vk1", acc2: null },
      },
    });

    const { result } = renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1, mockAccount2],
        currency: mockCurrency,
      }),
    );

    expect(result.current.confirmedAccountIds).toEqual(new Set(["acc1"]));
    expect(result.current.rejectedAccountIds).toEqual(new Set(["acc2"]));
  });

  it("returns request with correct appName, accounts, and currency", () => {
    const { result } = renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
      }),
    );

    expect(result.current.request).toEqual({
      appName: "Aleo",
      selectedAccounts: [mockAccount1],
      currency: mockCurrency,
    });
  });

  it("passes both connectAppExec and viewKeyExec overrides (mock mode)", () => {
    const mockedEmitter = jest.fn();

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
        connectAppExec: mockedEmitter,
        viewKeyExec: mockedEmitter,
      }),
    );

    expect(mockCreateAction).toHaveBeenCalledWith(mockedEmitter, mockedEmitter);
    expect(mockConnectApp).not.toHaveBeenCalled();
  });
});

describe("buildAccountsWithViewKeys", () => {
  it("returns patched accounts for entries present in the map", () => {
    const result = buildAccountsWithViewKeys([mockAccount1, mockAccount2], {
      acc1: "vk1",
      acc2: "vk2",
    });

    expect(result).toEqual([
      expect.objectContaining({ id: "acc1:patched:vk1" }),
      expect.objectContaining({ id: "acc2:patched:vk2" }),
    ]);
  });

  it("skips accounts whose view key is null", () => {
    const result = buildAccountsWithViewKeys([mockAccount1, mockAccount2], {
      acc1: "vk1",
      acc2: null,
    });

    expect(result).toEqual([expect.objectContaining({ id: "acc1:patched:vk1" })]);
  });

  it("skips accounts absent from the view keys map", () => {
    const result = buildAccountsWithViewKeys([mockAccount1, mockAccount2], { acc1: "vk1" });

    expect(result).toEqual([expect.objectContaining({ id: "acc1:patched:vk1" })]);
  });

  it("returns empty array when no view keys match", () => {
    const result = buildAccountsWithViewKeys([mockAccount1], {});
    expect(result).toEqual([]);
  });

  it("returns empty array for empty accounts input", () => {
    const result = buildAccountsWithViewKeys([], { acc1: "vk1" });
    expect(result).toEqual([]);
  });
});
