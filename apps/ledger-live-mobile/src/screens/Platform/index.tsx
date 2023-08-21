import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import React from "react";
import { Catalog as Catalog1, Props as CatalogProps } from "./Catalog";
import { Catalog as Catalog2 } from "./v2/Catalog";

export * from "./LiveApp";

export function Catalog(props: CatalogProps) {
  const config = useFeature("discover");

  return config?.enabled && config?.params.version === "2" ? <Catalog2 /> : <Catalog1 {...props} />;
}
