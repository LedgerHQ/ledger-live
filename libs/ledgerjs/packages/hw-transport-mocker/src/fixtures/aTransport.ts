import Transport from "@ledgerhq/hw-transport";
import { LocalTracer } from "@ledgerhq/logs";
import EventEmitter from "events";

/**
 * Builds a fake Transport object to use in tests
 *
 * Note: no Transport methods are implemented, this is duck typing a Transport to use on unit tests where
 * the transport instance does not matter. If a specific value is expected from a method, you can pass the
 * fake method implementation to the `props` of the builder.
 *
 * If you want a working mocked Transport, you should use `MockTransport`.
 *
 * Ex:
 * ```
 * aTransportBuilder({
 *   exchange: jest.fn().mockReturnValue(Buffer.from("Test")),
 * }),
 * ```
 *
 * @param props Any value in props will override the default fake value of the same property/method
 * @return A duck-typed Transport
 */
export const aTransportBuilder = (props?: Partial<Transport>): Transport => {
  return {
    exchangeTimeout: 30000,
    unresponsiveTimeout: 15000,
    deviceModel: null,
    tracer: new LocalTracer("mockedTransport", {}),
    _events: new EventEmitter(),
    exchangeBusyPromise: null,
    _appAPIlock: null,
    exchange: jest.fn(),
    exchangeBulk: jest.fn(),
    setScrambleKey: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    setDebugMode: jest.fn(),
    setExchangeTimeout: jest.fn(),
    setExchangeUnresponsiveTimeout: jest.fn(),
    send: jest.fn(),
    exchangeAtomicImpl: jest.fn(),
    decorateAppAPIMethods: jest.fn(),
    decorateAppAPIMethod: jest.fn(),
    setTraceContext: jest.fn(),
    getTraceContext: jest.fn(),
    ...props,
  };
};
