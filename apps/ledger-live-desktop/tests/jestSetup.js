import "@jest/globals";
import "@testing-library/jest-dom";
import { server } from "./server";
import { EventEmitter } from "events";

// Disable max listeners warning for MSW (known issue with multiple tests)
EventEmitter.defaultMaxListeners = 0;

jest.mock("framer-motion", () => {
  const originalModule = jest.requireActual("framer-motion");
  const overridenModule = jest.requireActual("./mocks/framerMotion.tsx");

  return {
    ...originalModule,
    ...overridenModule,
  };
});

global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate = global.clearImmediate || (id => global.clearTimeout(id));

class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver;

beforeAll(() =>
  server.listen({
    onUnhandledRequest: "bypass",
  }),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

jest.mock("src/sentry/install", () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setTags: jest.fn(),
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

jest.mock("@ledgerhq/react-ui/assets/fonts", () => ({}));

class WorkerMock {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }
  postMessage(msg) {
    console.log("Message posted to worker:", msg);
    this.onmessage({ data: "mock response" });
  }
  terminate() {
    console.log("Worker terminated");
  }
}

global.Worker = WorkerMock;

global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
};

jest.mock("src/renderer/analytics/segment", () => ({
  setAnalyticsFeatureFlagMethod: jest.fn(),
  start: jest.fn(),
  track: jest.fn(),
  trackPage: jest.fn(),
  useTrack: jest.fn(),
}));

jest.mock("src/sentry/renderer", () => ({
  captureException: jest.fn(),
  captureBreadcrumb: jest.fn(),
  setTags: jest.fn(),
}));

if (!globalThis.Buffer) {
  // Note: this polyfill depends on the patch buffer@6.0.3 which adds the Uint8
  // subarray logic. It's the same as in ledger-live-mobile
  // Furthermore, importing 'buffer' gets translated to 'node:buffer' so we're
  // using a relative path here
  const { Buffer } = require("../node_modules/buffer");
  Object.defineProperty(globalThis, "Buffer", { value: Buffer });
} else {
  // jsdom defines a global Buffer
  if (!(globalThis.Buffer.prototype instanceof Uint8Array)) {
    // jsdom does not define Buffer as an instance of Uint8Array, so we need to set it
    Object.setPrototypeOf(globalThis.Buffer.prototype, Uint8Array.prototype);
  }
}

jest.mock("@ledgerhq/device-transport-kit-web-hid");

jest.mock("react-redux", () => {
  const actual = jest.requireActual("react-redux");
  const withTypesSupport = hook => {
    const mockedHook = (...args) => hook(...args);
    mockedHook.withTypes = () => mockedHook;
    return mockedHook;
  };
  return {
    ...actual,
    useDispatch: withTypesSupport(actual.useDispatch),
    useSelector: withTypesSupport(actual.useSelector),
    useStore: withTypesSupport(actual.useStore),
  };
});

const originalError = console.error;
const originalWarn = console.warn;
// eslint-disable-next-line no-console
const originalLog = console.log;

const EXCLUDED_ERRORS = ["act(...)", "ReactDOMTestUtils.act", "Warning: findDOMNode is deprecated"];

const EXCLUDED_WARNINGS = ["@polkadot"];

const EXCLUDED_LOG_MESSAGES = ["Message posted to worker"];

console.error = (...args) => {
  const error = args.join();
  if (EXCLUDED_ERRORS.some(excluded => error.includes(excluded))) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  const warning = args.join();
  if (EXCLUDED_WARNINGS.some(excluded => warning.includes(excluded))) {
    return;
  }
  originalWarn.call(console, ...args);
};
// eslint-disable-next-line no-console
console.log = (...args) => {
  const log = args.join();
  if (EXCLUDED_LOG_MESSAGES.some(excluded => log.includes(excluded))) {
    return;
  }
  originalLog.call(console, ...args);
};
