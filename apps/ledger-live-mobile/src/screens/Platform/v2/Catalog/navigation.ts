type CatalogBackParentNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
};

type CatalogBackNavigation = {
  getParent: () => CatalogBackParentNavigation | undefined;
  goBack: () => void;
};

export function goBackFromWallet40Catalog(navigation: CatalogBackNavigation) {
  const parentNavigation = navigation.getParent();

  if (parentNavigation?.canGoBack()) {
    parentNavigation.goBack();
    return;
  }

  navigation.goBack();
}
