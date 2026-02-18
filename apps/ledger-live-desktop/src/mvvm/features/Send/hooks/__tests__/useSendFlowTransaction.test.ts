import { renderHook, act } from "tests/testSetup";
import { useSendFlowTransaction } from "../useSendFlowTransaction";
import * as bridgeModule from "@ledgerhq/live-common/bridge/index";
import * as useBridgeTransactionModule from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction");
jest.mock("@ledgerhq/live-common/bridge/index");

describe("useSendFlowTransaction", () => {
  const mockAccount = {
    id: "mock-account-id",
    currency: { family: "cosmos" },
  } as Account;

  const mockTransaction = {
    family: "cosmos",
    recipient: "",
    amount: new BigNumber(0),
  } as Transaction;

  const mockBridgeSetTransaction = jest.fn();
  const mockBridgeUpdateTransaction = jest.fn();
  const mockSetAccount = jest.fn();
  const mockUpdateTransaction = jest.fn((tx, updates) => ({ ...tx, ...updates }));

  beforeEach(() => {
    jest.clearAllMocks();

    (useBridgeTransactionModule.default as jest.Mock).mockReturnValue({
      transaction: mockTransaction,
      setTransaction: mockBridgeSetTransaction,
      updateTransaction: mockBridgeUpdateTransaction,
      status: { errors: {}, warnings: {} },
      bridgeError: null,
      bridgePending: false,
      setAccount: mockSetAccount,
    });

    (bridgeModule.getAccountBridge as jest.Mock).mockReturnValue({
      updateTransaction: mockUpdateTransaction,
    });
  });

  describe("setRecipient", () => {
    it("should update recipient address", () => {
      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.setRecipient({
          address: "cosmos1abc123",
        });
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(mockTransaction, {
        recipient: "cosmos1abc123",
      });
      expect(mockBridgeSetTransaction).toHaveBeenCalled();
    });

    it("should apply memo for cosmos", () => {
      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.setRecipient({
          address: "cosmos1abc123",
          memo: { value: "test memo" },
        });
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(mockTransaction, {
        recipient: "cosmos1abc123",
        memo: "test memo",
      });
    });

    it("should apply memo for solana with nested structure", () => {
      const solanaTransaction = {
        family: "solana",
        recipient: "",
        amount: new BigNumber(0),
        model: {
          kind: "transfer",
          uiState: {},
        },
      } as Transaction;

      (useBridgeTransactionModule.default as jest.Mock).mockReturnValue({
        transaction: solanaTransaction,
        setTransaction: mockBridgeSetTransaction,
        updateTransaction: mockBridgeUpdateTransaction,
        status: { errors: {}, warnings: {} },
        bridgeError: null,
        bridgePending: false,
        setAccount: mockSetAccount,
      });

      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.setRecipient({
          address: "solana-address",
          memo: { value: "solana memo" },
        });
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        solanaTransaction,
        expect.objectContaining({
          recipient: "solana-address",
          model: expect.objectContaining({
            uiState: expect.objectContaining({
              memo: "solana memo",
            }),
          }),
        }),
      );
    });

    it("should apply tag for xrp", () => {
      const xrpTransaction = {
        family: "xrp",
        recipient: "",
        amount: new BigNumber(0),
      } as Transaction;

      (useBridgeTransactionModule.default as jest.Mock).mockReturnValue({
        transaction: xrpTransaction,
        setTransaction: mockBridgeSetTransaction,
        updateTransaction: mockBridgeUpdateTransaction,
        status: { errors: {}, warnings: {} },
        bridgeError: null,
        bridgePending: false,
        setAccount: mockSetAccount,
      });

      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.setRecipient({
          address: "xrp-address",
          destinationTag: "12345",
        });
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(xrpTransaction, {
        recipient: "xrp-address",
        tag: 12345,
      });
    });

    it("should apply transferId for casper", () => {
      const casperTransaction = {
        family: "casper",
        recipient: "",
        amount: new BigNumber(0),
        fees: new BigNumber(0),
      } as Transaction;

      (useBridgeTransactionModule.default as jest.Mock).mockReturnValue({
        transaction: casperTransaction,
        setTransaction: mockBridgeSetTransaction,
        updateTransaction: mockBridgeUpdateTransaction,
        status: { errors: {}, warnings: {} },
        bridgeError: null,
        bridgePending: false,
        setAccount: mockSetAccount,
      });

      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.setRecipient({
          address: "casper-address",
          memo: { value: "transfer-id-123" },
        });
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(casperTransaction, {
        recipient: "casper-address",
        transferId: "transfer-id-123",
      });
    });

    it("should handle both memo and destinationTag for xrp", () => {
      const xrpTransaction = {
        family: "xrp",
        recipient: "",
        amount: new BigNumber(0),
      } as Transaction;

      (useBridgeTransactionModule.default as jest.Mock).mockReturnValue({
        transaction: xrpTransaction,
        setTransaction: mockBridgeSetTransaction,
        updateTransaction: mockBridgeUpdateTransaction,
        status: { errors: {}, warnings: {} },
        bridgeError: null,
        bridgePending: false,
        setAccount: mockSetAccount,
      });

      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.setRecipient({
          address: "xrp-address",
          memo: { value: "test" },
          destinationTag: "67890",
        });
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(xrpTransaction, {
        recipient: "xrp-address",
        tag: 67890,
      });
    });

    it("should ignore invalid destinationTag", () => {
      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.setRecipient({
          address: "xrp-address",
          destinationTag: "invalid",
        });
      });

      expect(mockUpdateTransaction).toHaveBeenCalledWith(mockTransaction, {
        recipient: "xrp-address",
      });
    });

    it("should not update when account is null", () => {
      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: null,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.setRecipient({
          address: "test-address",
        });
      });

      expect(mockUpdateTransaction).not.toHaveBeenCalled();
    });
  });

  describe("setTransaction", () => {
    it("should set transaction", () => {
      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      const newTransaction: Transaction = {
        ...mockTransaction,
        recipient: "new-address",
      };

      act(() => {
        result.current.actions.setTransaction(newTransaction);
      });

      expect(mockBridgeSetTransaction).toHaveBeenCalledWith(newTransaction);
    });
  });

  describe("updateTransaction", () => {
    it("should update transaction with updater function", () => {
      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      act(() => {
        result.current.actions.updateTransaction(tx => ({
          ...tx,
          recipient: "updated-address",
        }));
      });

      expect(mockBridgeUpdateTransaction).toHaveBeenCalled();
    });
  });

  describe("state", () => {
    it("should return correct state", () => {
      const { result } = renderHook(() =>
        useSendFlowTransaction({
          account: mockAccount,
          parentAccount: null,
        }),
      );

      expect(result.current.state).toEqual({
        transaction: mockTransaction,
        status: { errors: {}, warnings: {} },
        bridgeError: null,
        bridgePending: false,
      });
    });
  });
});
