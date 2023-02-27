import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import React from "react";
import { Catalog as Catalog1, Props as CatalogProps } from "./Catalog";
import { Catalog as Catalog2 } from "./v2/Catalog";
import { LiveApp as LiveApp1, Props as LiveAppProps } from "./LiveApp";
import { LiveApp as LiveApp2 } from "./v2/LiveApp";

export function Catalog(props: CatalogProps) {
  const version = useEnv("PLATFORM_DISCOVER_VERSION");

  return version === 2 ? <Catalog2 {...props} /> : <Catalog1 {...props} />;
}

export function LiveApp(props: LiveAppProps) {
  const version = useEnv("PLATFORM_DISCOVER_VERSION");

  return version === 2 ? <LiveApp2 {...props} /> : <LiveApp1 {...props} />;
}
