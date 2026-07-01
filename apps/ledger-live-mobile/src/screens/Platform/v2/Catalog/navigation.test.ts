import { goBackFromWallet40Catalog } from "./navigation";

describe("goBackFromWallet40Catalog", () => {
  it("should leave the Discover navigator through its parent when possible", () => {
    const parentGoBack = jest.fn();
    const navigationGoBack = jest.fn();

    goBackFromWallet40Catalog({
      getParent: () => ({
        canGoBack: () => true,
        goBack: parentGoBack,
      }),
      goBack: navigationGoBack,
    });

    expect(parentGoBack).toHaveBeenCalledTimes(1);
    expect(navigationGoBack).not.toHaveBeenCalled();
  });

  it("should fall back to the current navigator when the parent cannot go back", () => {
    const parentGoBack = jest.fn();
    const navigationGoBack = jest.fn();

    goBackFromWallet40Catalog({
      getParent: () => ({
        canGoBack: () => false,
        goBack: parentGoBack,
      }),
      goBack: navigationGoBack,
    });

    expect(parentGoBack).not.toHaveBeenCalled();
    expect(navigationGoBack).toHaveBeenCalledTimes(1);
  });

  it("should fall back to the current navigator without a parent", () => {
    const navigationGoBack = jest.fn();

    goBackFromWallet40Catalog({
      getParent: () => undefined,
      goBack: navigationGoBack,
    });

    expect(navigationGoBack).toHaveBeenCalledTimes(1);
  });
});
