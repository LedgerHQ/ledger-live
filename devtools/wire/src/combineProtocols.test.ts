import type { MessageMap, Transport, TransportProtocol } from "@devtools/transport";
import { combineProtocols } from "./combineProtocols";

function makeProtocol(
  overrides?: Partial<TransportProtocol<MessageMap>>,
): TransportProtocol<MessageMap> {
  return {
    onReceive: jest.fn(),
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onError: jest.fn(),
    ...overrides,
  };
}

const transport = {} as Transport<MessageMap>;
const env = {} as never;

describe("combineProtocols — onOpen", () => {
  it("should call onOpen on all protocols", () => {
    const a = makeProtocol();
    const b = makeProtocol();
    const combined = combineProtocols(a, b);

    combined.onOpen?.(transport);

    expect(a.onOpen).toHaveBeenCalledWith(transport);
    expect(b.onOpen).toHaveBeenCalledWith(transport);
  });

  it("should not throw when a protocol has no onOpen", () => {
    const a = makeProtocol({ onOpen: undefined });
    const combined = combineProtocols(a);

    expect(() => combined.onOpen?.(transport)).not.toThrow();
  });
});

describe("combineProtocols — onReceive", () => {
  it("should call onReceive on all protocols", () => {
    const a = makeProtocol();
    const b = makeProtocol();
    const combined = combineProtocols(a, b);

    combined.onReceive("action", { type: "inc" }, env);

    expect(a.onReceive).toHaveBeenCalledWith("action", { type: "inc" }, env);
    expect(b.onReceive).toHaveBeenCalledWith("action", { type: "inc" }, env);
  });
});

describe("combineProtocols — onClose", () => {
  it("should call onClose on all protocols", () => {
    const a = makeProtocol();
    const b = makeProtocol();
    const combined = combineProtocols(a, b);

    combined.onClose?.();

    expect(a.onClose).toHaveBeenCalledTimes(1);
    expect(b.onClose).toHaveBeenCalledTimes(1);
  });

  it("should not throw when a protocol has no onClose", () => {
    const a = makeProtocol({ onClose: undefined });
    const combined = combineProtocols(a);

    expect(() => combined.onClose?.()).not.toThrow();
  });
});

describe("combineProtocols — onError", () => {
  it("should call onError on all protocols", () => {
    const a = makeProtocol();
    const b = makeProtocol();
    const combined = combineProtocols(a, b);
    const err = new Error("socket failure");

    combined.onError?.(err);

    expect(a.onError).toHaveBeenCalledWith(err);
    expect(b.onError).toHaveBeenCalledWith(err);
  });

  it("should not throw when a protocol has no onError", () => {
    const a = makeProtocol({ onError: undefined });
    const combined = combineProtocols(a);

    expect(() => combined.onError?.(new Error())).not.toThrow();
  });
});
