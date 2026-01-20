import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

if (!global.setImmediate) {
  global.setImmediate = ((callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    setTimeout(callback, 0, ...args)) as typeof global.setImmediate;
}

afterEach(() => {
  cleanup();
});
