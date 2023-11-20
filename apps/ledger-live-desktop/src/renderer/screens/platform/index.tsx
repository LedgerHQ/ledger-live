import React from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Catalog as Catalog1 } from "./Catalog";
import { Catalog as Catalog2 } from "./v2/Catalog";
export * from "./LiveApp";

export default function PlatformCatalog() {
  const config = useFeature("discover");

  return config?.enabled && config?.params?.version === "2" ? <Catalog2 /> : <Catalog1 />;
}
