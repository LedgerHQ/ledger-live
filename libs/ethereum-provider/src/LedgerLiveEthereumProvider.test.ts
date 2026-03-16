import { LedgerLiveEthereumProvider } from "./LedgerLiveEthereumProvider";
import type {
  MinimalEventSourceInterface,
  MinimalEventTargetInterface,
} from "./LedgerLiveEthereumProvider";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("LedgerLiveEthereumProvider", () => {
  it("should use uuid for request id when requestId is not provided (getUniqueId)", async () => {
    let capturedPayload: { id?: string; method?: string } | null = null;
    let messageHandler: ((e: MessageEvent) => void) | null = null;

    const eventTarget: MinimalEventTargetInterface = {
      postMessage(message, _targetOrigin?) {
        capturedPayload = message as { id?: string; method?: string };
      },
    };

    const eventSource: MinimalEventSourceInterface = {
      addEventListener(_eventType: "message", handler: (message: MessageEvent) => void) {
        messageHandler = handler;
      },
    };

    const provider = new LedgerLiveEthereumProvider({
      eventTarget,
      eventSource,
      timeoutMilliseconds: 100,
    });

    const requestPromise = provider.request({ method: "eth_chainId" });

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload!.id).toBeDefined();
    expect(String(capturedPayload!.id)).toMatch(UUID_REGEX);
    expect(capturedPayload!.method).toBe("eth_chainId");

    const id = capturedPayload!.id;
    expect(messageHandler).not.toBeNull();
    messageHandler!({
      data: { id, jsonrpc: "2.0", result: "0x1" },
    } as MessageEvent);

    await expect(requestPromise).resolves.toBe("0x1");
  });
});
