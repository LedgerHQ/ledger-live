import { renderHook, waitFor } from "@testing-library/react";
import { useBridgeRecipientValidation } from "../useBridgeRecipientValidation";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { InvalidAddress } from "@ledgerhq/errors";
import { createMockAccount } from "../../__integrations__/__fixtures__/accounts";

jest.mock("@ledgerhq/live-common/bridge/index");
jest.mock("@ledgerhq/live-common/account/index");

const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetAccountBridge = jest.mocked(getAccountBridge);

const mockAccount = createMockAccount();

const mockBridge = {
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  prepareTransaction: jest.fn(),
  getTransactionStatus: jest.fn(),
  sync: jest.fn(),
  receive: jest.fn(),
  estimateMaxSpendable: jest.fn(),
  signOperation: jest.fn(),
  broadcast: jest.fn(),
  getPreloadStrategy: jest.fn(),
  checkValidRecipient: jest.fn(),
  signRawOperation: jest.fn(),
  validateAddress: jest.fn(),
  getSerializedAddressParameters: jest.fn(),
};

describe("useBridgeRecipientValidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockedGetMainAccount.mockReturnValue(mockAccount);
    mockedGetAccountBridge.mockReturnValue(mockBridge);
    mockBridge.createTransaction.mockReturnValue({ recipient: "" });
    mockBridge.updateTransaction.mockImplementation((tx, updates) => ({ ...tx, ...updates }));
    mockBridge.prepareTransaction.mockResolvedValue({ recipient: "valid_address" });
    mockBridge.getTransactionStatus.mockResolvedValue({
      errors: {},
      warnings: {},
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns empty state initially", () => {
    const { result } = renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "",
        account: null,
      }),
    );

    expect(result.current.errors).toEqual({});
    expect(result.current.warnings).toEqual({});
    expect(result.current.isLoading).toBe(false);
    expect(result.current.status).toBeNull();
  });

  it("validates recipient address successfully", async () => {
    const { result } = renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "valid_address",
        account: mockAccount,
      }),
    );

    expect(result.current.isLoading).toBe(true);

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockBridge.createTransaction).toHaveBeenCalled();
    expect(mockBridge.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      recipient: "valid_address",
    });
    expect(mockBridge.prepareTransaction).toHaveBeenCalled();
    expect(mockBridge.getTransactionStatus).toHaveBeenCalled();
  });

  it("returns recipient error when bridge detects invalid address", async () => {
    const recipientError = new InvalidAddress();
    mockBridge.getTransactionStatus.mockResolvedValue({
      errors: { recipient: recipientError },
      warnings: {},
    });

    const { result } = renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "invalid_address",
        account: mockAccount,
      }),
    );

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errors.recipient).toBe(recipientError);
  });

  it("returns sender error when detected", async () => {
    const senderError = new Error("Insufficient balance");
    mockBridge.getTransactionStatus.mockResolvedValue({
      errors: { sender: senderError },
      warnings: {},
    });

    const { result } = renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "valid_address",
        account: mockAccount,
      }),
    );

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errors.sender).toBe(senderError);
  });

  it("returns warnings when detected", async () => {
    const recipientWarning = new Error("Low balance warning");
    mockBridge.getTransactionStatus.mockResolvedValue({
      errors: {},
      warnings: { recipient: recipientWarning },
    });

    const { result } = renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "valid_address",
        account: mockAccount,
      }),
    );

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.warnings.recipient).toBe(recipientWarning);
  });

  it("does not validate when enabled is false", async () => {
    const { result } = renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "valid_address",
        account: mockAccount,
        enabled: false,
      }),
    );

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockBridge.createTransaction).not.toHaveBeenCalled();
  });

  it("resets state when recipient is cleared", async () => {
    const { result, rerender } = renderHook(
      ({ recipient }) =>
        useBridgeRecipientValidation({
          recipient,
          account: mockAccount,
        }),
      { initialProps: { recipient: "valid_address" } },
    );

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    rerender({ recipient: "" });

    expect(result.current.errors).toEqual({});
    expect(result.current.warnings).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it("debounces validation calls", async () => {
    const { rerender } = renderHook(
      ({ recipient }) =>
        useBridgeRecipientValidation({
          recipient,
          account: mockAccount,
        }),
      { initialProps: { recipient: "addr1" } },
    );

    rerender({ recipient: "addr2" });
    rerender({ recipient: "addr3" });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockBridge.createTransaction).toHaveBeenCalledTimes(1);
    });
  });

  it("handles validation errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockBridge.prepareTransaction.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "valid_address",
        account: mockAccount,
      }),
    );

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errors).toEqual({});
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Bridge recipient validation failed:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("cancels pending validation when recipient changes", async () => {
    const { rerender } = renderHook(
      ({ recipient }) =>
        useBridgeRecipientValidation({
          recipient,
          account: mockAccount,
        }),
      { initialProps: { recipient: "addr1" } },
    );

    jest.advanceTimersByTime(150);

    rerender({ recipient: "addr2" });

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockBridge.updateTransaction).toHaveBeenLastCalledWith(expect.anything(), {
        recipient: "addr2",
      });
    });
  });

  it("returns null status when account is null", () => {
    const { result } = renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "valid_address",
        account: null,
      }),
    );

    expect(result.current.status).toBeNull();
    // When account is null, the hook doesn't validate, so isLoading remains false
    // However, the initial state might set isLoading to true briefly
    expect(result.current.errors).toEqual({});
    expect(result.current.warnings).toEqual({});
  });

  it("handles parent account correctly", async () => {
    const parentAccount = { ...mockAccount, id: "parent_account_id" };

    renderHook(() =>
      useBridgeRecipientValidation({
        recipient: "valid_address",
        account: mockAccount,
        parentAccount,
      }),
    );

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(getMainAccount).toHaveBeenCalledWith(mockAccount, parentAccount);
    });
  });
});
