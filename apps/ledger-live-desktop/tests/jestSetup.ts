import { jest } from "@jest/globals";
import { TextDecoder, TextEncoder } from "util";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore  FIX TS config
jest.mock("@sentry/electron/renderer", () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setTags: jest.fn(),
}));

jest.mock("src/sentry/install", () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setTags: jest.fn(),
}));

class Worker {
  url: string;
  onmessage: (msg: string) => void;
  constructor(stringUrl: string) {
    this.url = stringUrl;
    this.onmessage = jest.fn();
  }
  postMessage(msg: string): void {
    this.onmessage(msg);
  }
}

Object.defineProperty(window, "Worker", {
  writable: true,
  value: Worker,
});

global.TextEncoder = TextEncoder;
// @ts-expect-error weird compatibility
global.TextDecoder = TextDecoder;
global.setImmediate =
  global.setImmediate ||
  ((fn: (...args: any[]) => void, ...args: any) => global.setTimeout(fn, 0, ...args));

const analytics = {
  identify: jest.fn(),
};

global.window.analytics = analytics;
