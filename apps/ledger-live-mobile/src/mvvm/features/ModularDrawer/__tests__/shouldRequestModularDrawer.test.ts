import { shouldRequestModularDrawer } from "../shouldRequestModularDrawer";

const singleAssetBuy = {
  isOpen: true,
  hasSearchedValue: false,
  hasOneCurrency: false,
  enableAccountSelection: false,
  completionMode: "currency" as const,
  isAssetsError: false,
  isCurrentCatalogReady: true,
  hasPresentedSheet: false,
  canAutoResolveSingleAsset: true,
};

describe("shouldRequestModularDrawer", () => {
  it("should keep the sheet closed when a single ready asset resolves on its own", () => {
    expect(shouldRequestModularDrawer(singleAssetBuy)).toBe(false);
  });

  it("should keep the sheet closed while the current currency catalog is not ready", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        isCurrentCatalogReady: false,
        canAutoResolveSingleAsset: false,
      }),
    ).toBe(false);
  });

  it("should keep the sheet closed when a loaded catalog is replaced by another network", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        isCurrentCatalogReady: false,
        canAutoResolveSingleAsset: true,
      }),
    ).toBe(false);
  });

  it("should open the sheet when several assets need a choice", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        canAutoResolveSingleAsset: false,
      }),
    ).toBe(true);
  });

  it("should open the sheet when a single asset still needs a network choice", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        canAutoResolveSingleAsset: false,
      }),
    ).toBe(true);
  });

  it("should open the sheet when the currency catalog fails to load", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        isAssetsError: true,
        isCurrentCatalogReady: false,
        canAutoResolveSingleAsset: false,
      }),
    ).toBe(true);
  });

  it("should keep an open error sheet up while the catalog retries and then resolves", () => {
    const failed = {
      ...singleAssetBuy,
      isAssetsError: true,
      isCurrentCatalogReady: false,
      canAutoResolveSingleAsset: false,
    };
    expect(shouldRequestModularDrawer(failed)).toBe(true);

    expect(
      shouldRequestModularDrawer({
        ...failed,
        isAssetsError: false,
        hasPresentedSheet: true,
      }),
    ).toBe(true);

    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        hasPresentedSheet: true,
      }),
    ).toBe(true);
  });

  it("should open a device flow sheet when the only asset is already ready", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        completionMode: undefined,
      }),
    ).toBe(true);
  });

  it("should keep a device flow sheet open when a single asset arrives", () => {
    const deviceFlow = {
      ...singleAssetBuy,
      completionMode: undefined,
      canAutoResolveSingleAsset: false,
    };
    expect(
      shouldRequestModularDrawer({
        ...deviceFlow,
        isCurrentCatalogReady: false,
      }),
    ).toBe(true);

    expect(
      shouldRequestModularDrawer({
        ...deviceFlow,
        isCurrentCatalogReady: true,
        canAutoResolveSingleAsset: true,
        hasPresentedSheet: true,
      }),
    ).toBe(true);
  });

  it("should keep the sheet closed for one preselected currency without account selection", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        completionMode: undefined,
        hasOneCurrency: true,
        isCurrentCatalogReady: false,
        canAutoResolveSingleAsset: false,
      }),
    ).toBe(false);
  });

  it("should open the sheet for one preselected currency when an account must be chosen", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        completionMode: undefined,
        hasOneCurrency: true,
        enableAccountSelection: true,
        canAutoResolveSingleAsset: false,
      }),
    ).toBe(true);
  });

  it("should open the sheet while a multi-currency catalog is loading", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        completionMode: undefined,
        isCurrentCatalogReady: false,
        canAutoResolveSingleAsset: false,
      }),
    ).toBe(true);
  });

  it("should keep the sheet open while the user is searching", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        hasSearchedValue: true,
      }),
    ).toBe(true);
  });

  it("should keep the sheet closed when the drawer is closed", () => {
    expect(
      shouldRequestModularDrawer({
        ...singleAssetBuy,
        isOpen: false,
        canAutoResolveSingleAsset: false,
      }),
    ).toBe(false);
  });
});
