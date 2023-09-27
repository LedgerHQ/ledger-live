import React from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Catalog as Catalog1 } from "./Catalog";
import { Catalog as Catalog2 } from "./v2/Catalog";
import { RecentlyUsedDB } from "@ledgerhq/live-common/wallet-api/react";
export * from "./LiveApp";

export function PlatformCatalog({ db }: { db: RecentlyUsedDB }) {
  const config = useFeature("discover");

  return config?.enabled && config?.params?.version === "2" ? <Catalog2 db={db} /> : <Catalog1 />;
}
