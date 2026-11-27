import { act, renderHook } from "@tests/test-renderer";
import type { WalletApiDeviceIntentSignRequest } from "../components/TransactionSignatureDrawer/types";
import type { WalletApiDeviceIntentSignMessageRequest } from "../components/MessageSignatureDrawer/types";
import type { WalletApiDeviceIntentSignRawRequest } from "../components/RawTransactionSignatureDrawer/types";
import { useWalletApiSignatureQueue } from "./useWalletApiSignatureQueue";

const firstTransaction = { manifestId: "first" } as unknown as WalletApiDeviceIntentSignRequest;
const secondTransaction = { manifestId: "second" } as unknown as WalletApiDeviceIntentSignRequest;
const message = { manifestId: "message" } as unknown as WalletApiDeviceIntentSignMessageRequest;
const rawTransaction = { manifestId: "raw" } as unknown as WalletApiDeviceIntentSignRawRequest;

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
      result.current.enqueueRawTransactionSignature(rawTransaction);
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
      type: "rawTransaction",
      request: rawTransaction,
    });

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
});
