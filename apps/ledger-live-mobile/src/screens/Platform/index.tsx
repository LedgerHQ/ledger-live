import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import React from "react";
import { Catalog as Catalog1, Props as CatalogProps } from "./Catalog";
import { Catalog as Catalog2 } from "./v2/Catalog";
import { LiveApp as LiveApp1, Props as LiveAppProps } from "./LiveApp";
import { LiveApp as LiveApp2 } from "./v2/LiveApp";

export function Catalog(props: CatalogProps) {
  const config = useFeature("discover");

  return config?.enabled && config?.params.version === "2" ? (
    <Catalog2 {...props} />
  ) : (
    <Catalog1 {...props} />
  );
}

export function LiveApp(props: LiveAppProps) {
  const config = useFeature("discover");

  return config?.enabled && config?.params.version === "2" ? (
    <LiveApp2 {...props} />
  ) : (
    <LiveApp1 {...props} />
  );
}
