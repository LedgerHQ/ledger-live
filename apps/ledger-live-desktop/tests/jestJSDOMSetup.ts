import { jest } from "@jest/globals";

const analytics = {
  identify: jest.fn(),
};

global.window.analytics = analytics;
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

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
