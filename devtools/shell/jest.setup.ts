import "@testing-library/jest-dom";

const originalError = console.error;

const EXCLUDED_ERRORS = ["act(...)"];

console.error = (...args) => {
  if (EXCLUDED_ERRORS.some(excluded => args.join().includes(excluded))) return;
  originalError.call(console, ...args);
};

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
