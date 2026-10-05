// The clipboard is a native module, so it calls `getEnforcing` on the stubbed `react-native` and
// throws. Self-contained doubles rather than the library's own jest mock, so a flow package needs
// no dependency on it here. Both interop shapes are exposed: callers import the default export.
const Clipboard = {
  getString: jest.fn().mockResolvedValue(""),
  setString: jest.fn(),
  hasString: jest.fn().mockResolvedValue(false),
  addListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

module.exports = { __esModule: true, ...Clipboard, default: Clipboard };
