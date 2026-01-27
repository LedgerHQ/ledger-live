export const jest = {
  fn: (impl = () => undefined) => {
    const mockFn = (...args) => impl(...args);
    mockFn.mock = { calls: [] };
    return mockFn;
  },
};

export const fn = jest.fn;
