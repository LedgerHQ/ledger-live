// expo-clipboard needs a native runtime, and pnpm gives the app and the workspace packages it
// renders separate copies; moduleNameMapper points every copy here. CommonJS so tests can spyOn it.
module.exports = {
  getStringAsync: jest.fn(() => Promise.resolve("")),
  setStringAsync: jest.fn(() => Promise.resolve(true)),
  hasStringAsync: jest.fn(() => Promise.resolve(false)),
};
