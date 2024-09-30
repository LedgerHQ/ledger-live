import "@jest/globals";
import "@testing-library/jest-dom";
import { server } from "./server";
import { ALLOWED_UNHANDLED_REQUESTS } from "./handlers";

global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));

beforeAll(() =>
  server.listen({
    onUnhandledRequest(request, print) {
      if (ALLOWED_UNHANDLED_REQUESTS.some(ignoredUrl => request.url.includes(ignoredUrl))) {
        return;
      }
      print.warning();
    },
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
  track: jest.fn(),
  trackPage: jest.fn(),
  start: jest.fn(),
  useTrack: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

jest.mock("src/sentry/renderer", () => ({
  captureException: jest.fn(),
  captureBreadcrumb: jest.fn(),
  setTags: jest.fn(),
  getSentryIfAvailable: jest.fn().mockReturnValue(false),
}));
