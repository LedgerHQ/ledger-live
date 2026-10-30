// The clipboard is a native module, so it throws on the stubbed `react-native`. Self-contained
// doubles rather than a library mock, so a flow package needs no dependency on it here.
module.exports = {
  __esModule: true,
  getStringAsync: jest.fn().mockResolvedValue(""),
  setStringAsync: jest.fn().mockResolvedValue(true),
  hasStringAsync: jest.fn().mockResolvedValue(false),
};
