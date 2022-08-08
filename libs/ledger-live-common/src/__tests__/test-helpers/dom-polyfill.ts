import { TextDecoder, TextEncoder } from "util";
global.TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.TextDecoder = TextDecoder;

jest.mock("uuid", () => ({
  v1: () => "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
  v4: () => "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
  v5: () => "110ec58a-a0f2-4ac4-8393-c866d813b8d1",
}));

// this is just a little hack to silence a warning that we'll get until we
// upgrade to 16.9. See also: https://github.com/facebook/react/pull/14853
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
