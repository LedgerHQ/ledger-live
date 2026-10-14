export const launchImageLibraryAsync = jest.fn(() =>
  Promise.resolve({ canceled: true, assets: null }),
);
