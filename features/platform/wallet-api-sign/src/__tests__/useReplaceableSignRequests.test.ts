import { act, renderHook } from "@testing-library/react";
import { useReplaceableSignRequests } from "../useReplaceableSignRequests";

type TxRequest = Readonly<{ id: string }>;
type MsgRequest = Readonly<{ id: string }>;

describe("useReplaceableSignRequests", () => {
  it("invokes onReplaceTransaction when a second transaction request arrives", () => {
    const onReplaceTransaction = jest.fn();
    const onReplaceMessage = jest.fn();
    const { result } = renderHook(() =>
      useReplaceableSignRequests<TxRequest, MsgRequest>({
        onReplaceTransaction,
        onReplaceMessage,
      }),
    );

    const first: TxRequest = { id: "tx-1" };
    const second: TxRequest = { id: "tx-2" };

    act(() => {
      result.current.requestDeviceIntentSign(first);
    });
    const firstId = result.current.deviceIntentSignEntry?.requestId;

    act(() => {
      result.current.requestDeviceIntentSign(second);
    });

    expect(onReplaceTransaction).toHaveBeenCalledTimes(1);
    expect(onReplaceTransaction).toHaveBeenCalledWith(first);
    expect(result.current.deviceIntentSignEntry?.request).toBe(second);
    expect(result.current.deviceIntentSignEntry?.requestId).not.toBe(firstId);
  });

  it("invokes onReplaceMessage when a second message request arrives", () => {
    const onReplaceTransaction = jest.fn();
    const onReplaceMessage = jest.fn();
    const { result } = renderHook(() =>
      useReplaceableSignRequests<TxRequest, MsgRequest>({
        onReplaceTransaction,
        onReplaceMessage,
      }),
    );

    const first: MsgRequest = { id: "msg-1" };
    const second: MsgRequest = { id: "msg-2" };

    act(() => {
      result.current.requestDeviceIntentSignMessage(first);
    });
    act(() => {
      result.current.requestDeviceIntentSignMessage(second);
    });

    expect(onReplaceMessage).toHaveBeenCalledTimes(1);
    expect(onReplaceMessage).toHaveBeenCalledWith(first);
    expect(result.current.deviceIntentSignMessageEntry?.request).toBe(second);
  });

  it("ignores stale clears from replaced requests and clears all entries on reset", () => {
    const { result } = renderHook(() =>
      useReplaceableSignRequests<TxRequest, MsgRequest>({
        onReplaceTransaction: jest.fn(),
        onReplaceMessage: jest.fn(),
      }),
    );

    act(() => {
      result.current.requestDeviceIntentSign({ id: "tx-1" });
    });
    const firstTxId = result.current.deviceIntentSignEntry!.requestId;

    act(() => {
      result.current.requestDeviceIntentSign({ id: "tx-2" });
    });
    const secondTxId = result.current.deviceIntentSignEntry!.requestId;

    act(() => {
      result.current.clearDeviceIntentSignRequest(firstTxId);
    });
    expect(result.current.deviceIntentSignEntry?.requestId).toBe(secondTxId);

    act(() => {
      result.current.requestDeviceIntentSignMessage({ id: "msg-1" });
    });
    const firstMsgId = result.current.deviceIntentSignMessageEntry!.requestId;

    act(() => {
      result.current.requestDeviceIntentSignMessage({ id: "msg-2" });
    });
    const secondMsgId = result.current.deviceIntentSignMessageEntry!.requestId;

    act(() => {
      result.current.clearDeviceIntentSignMessageRequest(firstMsgId);
    });
    expect(result.current.deviceIntentSignMessageEntry?.requestId).toBe(secondMsgId);

    act(() => {
      result.current.clearAllDeviceIntentSignRequests();
    });
    expect(result.current.deviceIntentSignEntry).toBeNull();
    expect(result.current.deviceIntentSignMessageEntry).toBeNull();
  });
});
