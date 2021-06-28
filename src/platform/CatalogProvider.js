// @flow

import React, { useContext, useEffect, useMemo, useState } from "react";

import type { AppManifest, AppBranch, AppPlatform } from "./types";
import { isSupported, matchPlatform, matchBranches } from "./logic";

import api from "./api";

type State = {
  apps: AppManifest[],
};

type Props = {
  children: React$Node,
};

const initialState = {
  apps: [],
};

export const PlatformCatalogContext = React.createContext<State>(initialState);

const PlatformCatalogProvider = ({ children }: Props) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    api.fetchManifest().then((manifest) => setState({ apps: manifest }));
  }, []);

  return (
    <PlatformCatalogContext.Provider value={state}>
      {children}
    </PlatformCatalogContext.Provider>
  );
};

export const usePlatformManifests = () => {
  const context = useContext(PlatformCatalogContext);
  if (context === undefined) {
    throw new Error(
      "usePlatformManifests must be used within a PlatformCatalogContext"
    );
  }

  return context;
};

export const useCatalog = (
  platform: AppPlatform = "all",
  branches?: AppBranch[] = ["stable"]
) => {
  const context = useContext(PlatformCatalogContext);
  if (context === undefined) {
    throw new Error("useCatalog must be used within a PlatformCatalogContext");
  }

  const apps = useMemo(
    (): AppManifest[] =>
      context.apps.filter(
        (manifest) =>
          matchPlatform(manifest, platform) &&
          (!branches || matchBranches(manifest, branches)) &&
          isSupported(manifest) &&
          !manifest.private
      ),
    [context.apps, branches, platform]
  );

  return {
    ...context,
    apps,
  };
};

export const useAppManifest = (platformId: string) => {
  const context = useContext(PlatformCatalogContext);
  if (context === undefined) {
    throw new Error(
      "useAppManifest must be used within a PlatformCatalogContext"
    );
  }

  const manifest = useMemo(
    () => context.apps.find((app) => app.id === platformId),
    [context.apps, platformId]
  );

  return manifest;
};

export default PlatformCatalogProvider;
