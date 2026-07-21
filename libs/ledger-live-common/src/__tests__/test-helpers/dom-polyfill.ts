import { TextDecoder, TextEncoder } from "util";

// Use defineProperty to avoid "Cannot assign to read only property" when
// global already has TextEncoder/TextDecoder (e.g. in jsdom / Node 19+).
Object.defineProperty(global, "TextEncoder", {
  value: TextEncoder,
  writable: true,
  configurable: true,
});
Object.defineProperty(global, "TextDecoder", {
  value: TextDecoder,
  writable: true,
  configurable: true,
});

jest.mock("uuid", () => ({
  v1: () => "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
  v4: () => "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
  v5: () => "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
}));

// Silence the React "not wrapped in act(...)" warning. React 18 prefixed it
// with "Warning:", React 19 dropped that prefix ("An update to X inside a test
// was not wrapped in act(...)"), so match on the stable part of the message.
// See also: https://github.com/facebook/react/pull/14853
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === "string" && /not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
