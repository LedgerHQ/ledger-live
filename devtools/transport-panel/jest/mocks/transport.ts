import type { Transport, TransportState, MessageMap } from "@devtools/transport";
import type { TransportPanelProps } from "../../src/types";

/**
 * getState returns a single stable object reference — required for useSyncExternalStore,
 * which compares snapshots with Object.is and loops if the reference changes every call.
 */
export function mockTransport(
  stateOverrides?: Partial<TransportState<MessageMap>>,
): Transport<MessageMap> {
  const state: TransportState<MessageMap> = {
    status: "open",
    url: "ws://localhost",
    origin: "local",
    history: [],
    ...stateOverrides,
  };
  return {
    getState: () => state,
    subscribe: jest.fn(() => jest.fn()),
    setUrl: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
  };
}

export function mockTransportPanelProps(
  overrides?: Partial<TransportPanelProps>,
): TransportPanelProps {
  return {
    transport: mockTransport(),
    hubUrl: "ws://localhost",
    setHubUrl: jest.fn(),
    role: "host",
    ...overrides,
  };
}
