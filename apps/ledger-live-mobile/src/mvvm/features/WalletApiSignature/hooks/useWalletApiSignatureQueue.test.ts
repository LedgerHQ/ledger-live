import { act, renderHook } from "@tests/test-renderer";
import type { WalletApiDeviceIntentSignRequest } from "../components/TransactionSignatureDrawer/types";
import type { WalletApiDeviceIntentSignMessageRequest } from "../components/MessageSignatureDrawer/types";
import { useWalletApiSignatureQueue } from "./useWalletApiSignatureQueue";

const firstTransaction = { manifestId: "first" } as unknown as WalletApiDeviceIntentSignRequest;
const secondTransaction = { manifestId: "second" } as unknown as WalletApiDeviceIntentSignRequest;
const message = { manifestId: "message" } as unknown as WalletApiDeviceIntentSignMessageRequest;

function buildTransaction(requestGroupId?: string) {
  return {
    manifestId: "wallet-connect",
    requestGroupId,
    onError: jest.fn(),
  } as unknown as WalletApiDeviceIntentSignRequest;
}

function buildMessage(requestGroupId?: string) {
  return {
    manifestId: "wallet-connect",
    requestGroupId,
    onError: jest.fn(),
  } as unknown as WalletApiDeviceIntentSignMessageRequest;
}

describe("useWalletApiSignatureQueue", () => {
  it("shows nothing when no request is pending", () => {
    const { result } = renderHook(() => useWalletApiSignatureQueue());

    expect(result.current.currentSignature).toBeNull();
  });

  it("keeps the shown request when another one arrives, and shows the next once it is closed", () => {
    const { result } = renderHook(() => useWalletApiSignatureQueue());

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
    const { result } = renderHook(() => useWalletApiSignatureQueue());

    act(() => {
      result.current.enqueueTransactionSignature(firstTransaction);
      result.current.enqueueTransactionSignature(firstTransaction);
    });
    const firstId = result.current.currentSignature?.id;
    act(() => result.current.closeCurrentSignature());

    expect(result.current.currentSignature?.id).not.toBe(firstId);
  });

  it("does not drop the next request when a closed request is closed again", () => {
    const { result } = renderHook(() => useWalletApiSignatureQueue());

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
    const { result } = renderHook(() => useWalletApiSignatureQueue());

    act(() => {
      result.current.enqueueTransactionSignature(firstTransaction);
      result.current.enqueueMessageSignature(message);
    });
    act(() => result.current.clearSignatures());

    expect(result.current.currentSignature).toBeNull();
  });

  describe("cancelSignatures", () => {
    it("rejects the shown and queued requests of the group, and keeps the others", () => {
      const shownOfGroup = buildTransaction("topic-a");
      const otherGroup = buildMessage("topic-b");
      const queuedOfGroup = buildMessage("topic-a");
      const untagged = buildTransaction();
      const { result } = renderHook(() => useWalletApiSignatureQueue());
      act(() => {
        result.current.enqueueTransactionSignature(shownOfGroup);
        result.current.enqueueMessageSignature(otherGroup);
        result.current.enqueueMessageSignature(queuedOfGroup);
        result.current.enqueueTransactionSignature(untagged);
      });

      let cancelled = 0;
      act(() => {
        cancelled = result.current.cancelSignatures("topic-a");
      });

      expect(cancelled).toBe(2);
      expect(shownOfGroup.onError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "SignatureRequestCancelled" }),
      );
      expect(queuedOfGroup.onError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "SignatureRequestCancelled" }),
      );
      expect(otherGroup.onError).not.toHaveBeenCalled();
      expect(untagged.onError).not.toHaveBeenCalled();
      expect(result.current.currentSignature?.request).toBe(otherGroup);
      act(() => result.current.closeCurrentSignature());
      expect(result.current.currentSignature?.request).toBe(untagged);
    });

    it("cancels a request enqueued in the same tick, before any render", () => {
      const request = buildTransaction("topic-a");
      const { result } = renderHook(() => useWalletApiSignatureQueue());

      let cancelled = 0;
      act(() => {
        result.current.enqueueTransactionSignature(request);
        cancelled = result.current.cancelSignatures("topic-a");
      });

      expect(cancelled).toBe(1);
      expect(request.onError).toHaveBeenCalledTimes(1);
      expect(result.current.currentSignature).toBeNull();
    });

    it("rejects a request of a cancelled group that arrives after the cancel, e.g. still preparing", () => {
      const lateTransaction = buildTransaction("topic-a");
      const lateMessage = buildMessage("topic-a");
      const otherGroup = buildTransaction("topic-b");
      const { result } = renderHook(() => useWalletApiSignatureQueue());
      act(() => {
        result.current.cancelSignatures("topic-a");
      });

      act(() => {
        result.current.enqueueTransactionSignature(lateTransaction);
        result.current.enqueueMessageSignature(lateMessage);
        result.current.enqueueTransactionSignature(otherGroup);
      });

      expect(lateTransaction.onError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "SignatureRequestCancelled" }),
      );
      expect(lateMessage.onError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "SignatureRequestCancelled" }),
      );
      expect(otherGroup.onError).not.toHaveBeenCalled();
      expect(result.current.currentSignature?.request).toBe(otherGroup);
    });

    it("forgets the cancelled groups when cleared, so a new session can reuse a group id", () => {
      const nextSessionRequest = buildTransaction("topic-a");
      const { result } = renderHook(() => useWalletApiSignatureQueue());
      act(() => {
        result.current.cancelSignatures("topic-a");
      });

      act(() => result.current.clearSignatures());
      act(() => result.current.enqueueTransactionSignature(nextSessionRequest));

      expect(nextSessionRequest.onError).not.toHaveBeenCalled();
      expect(result.current.currentSignature?.request).toBe(nextSessionRequest);
    });

    it("cancels nothing for a group without pending requests", () => {
      const request = buildTransaction("topic-a");
      const { result } = renderHook(() => useWalletApiSignatureQueue());
      act(() => result.current.enqueueTransactionSignature(request));

      let cancelled = -1;
      act(() => {
        cancelled = result.current.cancelSignatures("topic-b");
      });

      expect(cancelled).toBe(0);
      expect(request.onError).not.toHaveBeenCalled();
      expect(result.current.currentSignature?.request).toBe(request);
    });
  });
});
