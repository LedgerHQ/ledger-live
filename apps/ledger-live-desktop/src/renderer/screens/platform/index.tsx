import React from "react";
<<<<<<< HEAD
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
=======
import useFeature from "@ledgerhq/live-config/FeatureFlags/useFeature";
>>>>>>> f8e0133b13 (fix: refactoring)
import { Catalog as Catalog1 } from "./Catalog";
import { Catalog as Catalog2 } from "./v2/Catalog";
export * from "./LiveApp";

export default function PlatformCatalog() {
  const config = useFeature("discover");

  return config?.enabled && config?.params?.version === "2" ? <Catalog2 /> : <Catalog1 />;
}
