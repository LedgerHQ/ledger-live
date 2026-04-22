import { renderHook } from "tests/testSetup";
import {
  isSelfTransferTransaction,
  isPrivateTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { useAccountChangeGuard } from "./useAccountChangeGuard";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";
import { ALEO_ACCOUNT_1, ALEO_ACCOUNT_2 } from "../../../__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/aleo/utils");

const mockIsSelfTransferTransaction = jest.mocked(isSelfTransferTransaction);
const mockIsPrivateTransaction = jest.mocked(isPrivateTransaction);

describe("useAccountChangeGuard", () => {
  const onChangeAccount = jest.fn();
  const updateTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPrivateTransaction.mockReturnValue(false);
    mockIsSelfTransferTransaction.mockReturnValue(false);
  });

  it("should always call onChangeAccount with the next account and parent", () => {
    const { result } = renderHook(() => useAccountChangeGuard(onChangeAccount, updateTransaction));

    result.current(ALEO_ACCOUNT_1, null);

    expect(onChangeAccount).toHaveBeenCalledWith(ALEO_ACCOUNT_1, null);
  });

  it("should call updateTransaction once on every account change", () => {
    const { result } = renderHook(() => useAccountChangeGuard(onChangeAccount, updateTransaction));

    result.current(ALEO_ACCOUNT_2, null);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
  });

  it("should return tx unchanged when family is not aleo", () => {
    mockIsPrivateTransaction.mockReturnValue(true);
    const { result } = renderHook(() => useAccountChangeGuard(onChangeAccount, updateTransaction));

    result.current(ALEO_ACCOUNT_2, null);

    const updater = updateTransaction.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nonAleoTx = { family: "ethereum", mode: "transfer_private", recipient: "" } as any;
    const nextTx = updater(nonAleoTx);

    expect(nextTx).toBe(nonAleoTx);
  });

  it("should return tx unchanged when transaction is not private", () => {
    mockIsPrivateTransaction.mockReturnValue(false);
    const { result } = renderHook(() => useAccountChangeGuard(onChangeAccount, updateTransaction));

    result.current(ALEO_ACCOUNT_2, null);

    const updater = updateTransaction.mock.calls[0][0];
    const tx = makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC });
    const nextTx = updater(tx);

    expect(nextTx).toBe(tx);
  });

  it("should reset a private transaction to CONVERT_PUBLIC_TO_PRIVATE when it is a self-transfer", () => {
    mockIsPrivateTransaction.mockReturnValue(true);
    mockIsSelfTransferTransaction.mockReturnValue(true);
    const { result } = renderHook(() => useAccountChangeGuard(onChangeAccount, updateTransaction));

    result.current(ALEO_ACCOUNT_2, null);

    const updater = updateTransaction.mock.calls[0][0];
    const tx = makeAleoTransaction({
      mode: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
      properties: { amountRecordCommitment: "abc", feeRecordCommitment: null },
    });
    const nextTx = updater(tx);

    expect(nextTx.mode).toBe(TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE);
    expect(nextTx.properties).toBeUndefined();
  });

  it("should reset a private transaction to TRANSFER_PUBLIC when it is not a self-transfer", () => {
    mockIsPrivateTransaction.mockReturnValue(true);
    mockIsSelfTransferTransaction.mockReturnValue(false);
    const { result } = renderHook(() => useAccountChangeGuard(onChangeAccount, updateTransaction));

    result.current(ALEO_ACCOUNT_2, null);

    const updater = updateTransaction.mock.calls[0][0];
    const tx = makeAleoTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: { amountRecordCommitment: "xyz", feeRecordCommitment: null },
    });
    const nextTx = updater(tx);

    expect(nextTx.mode).toBe(TRANSACTION_TYPE.TRANSFER_PUBLIC);
    expect(nextTx.properties).toBeUndefined();
  });

  it("should preserve non-properties fields when resetting to public mode", () => {
    mockIsPrivateTransaction.mockReturnValue(true);
    mockIsSelfTransferTransaction.mockReturnValue(false);
    const { result } = renderHook(() => useAccountChangeGuard(onChangeAccount, updateTransaction));

    result.current(ALEO_ACCOUNT_2, null);

    const updater = updateTransaction.mock.calls[0][0];
    const tx = makeAleoTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      recipient: "aleo1recipient",
      properties: { amountRecordCommitment: "xyz", feeRecordCommitment: null },
    });
    const nextTx = updater(tx);

    expect(nextTx.recipient).toBe("aleo1recipient");
    expect(nextTx.family).toBe("aleo");
  });

  it("should pass the parent account to onChangeAccount", () => {
    const { result } = renderHook(() => useAccountChangeGuard(onChangeAccount, updateTransaction));

    result.current(ALEO_ACCOUNT_1, ALEO_ACCOUNT_2);

    expect(onChangeAccount).toHaveBeenCalledWith(ALEO_ACCOUNT_1, ALEO_ACCOUNT_2);
  });
});
