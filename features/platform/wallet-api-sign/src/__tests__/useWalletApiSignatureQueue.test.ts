import { act, renderHook } from "@testing-library/react";
import { useWalletApiSignatureQueue } from "../useWalletApiSignatureQueue";

type TransactionRequest = Readonly<{ manifestId: string; kind: "transaction" }>;
type MessageRequest = Readonly<{ manifestId: string; kind: "message" }>;

const firstTransaction: TransactionRequest = { manifestId: "first", kind: "transaction" };
const secondTransaction: TransactionRequest = { manifestId: "second", kind: "transaction" };
const message: MessageRequest = { manifestId: "message", kind: "message" };

function renderQueue() {
  return renderHook(() => useWalletApiSignatureQueue<TransactionRequest, MessageRequest>());
}

describe("useWalletApiSignatureQueue", () => {
  it("shows nothing when no request is pending", () => {
    const { result } = renderQueue();

    expect(result.current.currentSignature).toBeNull();
  });

  it("keeps the shown request when another one arrives, and shows the next once it is closed", () => {
    const { result } = renderQueue();

    act(() => {
      result.current.enqueueTransactionSignature(firstTransaction);
      result.current.enqueueMessageSignature(message);
      result.current.enqueueTransactionSignature(secondTransaction);
    });
    expect(result.current.currentSignature).toMatchObject({
      type: "transaction",
      request: firstTransaction,
    });

    act(() => result.current.closeCurrentSignature());
    expect(result.current.currentSignature).toMatchObject({ type: "message", request: message });

    act(() => result.current.closeCurrentSignature());
    expect(result.current.currentSignature).toMatchObject({
      type: "transaction",
      request: secondTransaction,
    });

    act(() => result.current.closeCurrentSignature());
    expect(result.current.currentSignature).toBeNull();
  });

  it("gives each request its own id so its drawer is mounted afresh", () => {
    const { result } = renderQueue();

    act(() => {
      result.current.enqueueTransactionSignature(firstTransaction);
      result.current.enqueueTransactionSignature(firstTransaction);
    });
    const firstId = result.current.currentSignature?.id;
    act(() => result.current.closeCurrentSignature());

    expect(result.current.currentSignature?.id).not.toBe(firstId);
  });

  it("does not drop the next request when a closed request is closed again", () => {
    const { result } = renderQueue();

    act(() => {
      result.current.enqueueTransactionSignature(firstTransaction);
      result.current.enqueueTransactionSignature(secondTransaction);
    });
    const closeFirst = result.current.closeCurrentSignature;
    act(() => closeFirst());
    act(() => closeFirst());

    expect(result.current.currentSignature?.request).toBe(secondTransaction);
  });

  it("drops every pending request when cleared", () => {
    const { result } = renderQueue();

    act(() => {
      result.current.enqueueTransactionSignature(firstTransaction);
      result.current.enqueueMessageSignature(message);
    });
    act(() => result.current.clearSignatures());

    expect(result.current.currentSignature).toBeNull();
  });
});
