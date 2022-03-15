interface GenericGlobalCatalogEntry {
  platform: string;
  branch: string;
  currencies: string[];
  tags: string[];
  categories: string[];
}

interface GlobalLiveAppCatalogEntry extends GenericGlobalCatalogEntry {
  type: "LIVE_APP";
  appId: string;
}

interface GlobalNativeCatalogEntry extends GenericGlobalCatalogEntry {
  type: "NATIVE";
  path: string;
}

export type GlobalCatalogEntry =
  | GlobalLiveAppCatalogEntry
  | GlobalNativeCatalogEntry;

type PromotedApp = {
  id: string;
  thumbnailUrl: string;
};

export type GlobalCatalog = {
  orderedCategories: string[];
  promotedApps: PromotedApp[];
  appsMetadata: GlobalCatalogEntry[];
};
