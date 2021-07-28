// @flow

import type { AppManifest } from "../types";

export type State = {
  remoteManifests: Map<string, AppManifest>, // remotely fetched manifests
  localManifests: Map<string, AppManifest>, // locally added manifests
  isLoading: boolean, // is remote currently updating
  lastUpdateTime: ?number, // last update time
  error: ?Error, // last update error
};

export type Props = {
  children: React$Node,
  autoUpdateDelay?: number, // interval between auto updated
  platformAppsServerURL: string, // remote server URL
};

export type API = {
  manifests: Map<string, AppManifest>,
  updateData: () => Promise<void>,
  addLocalManifest: (manifest: AppManifest) => void,
  removeLocalManifest: (id: string) => void,
};

export type PlatformAppContextType = State & API;

export type PlatformApi = {
  fetchManifest: (url: string) => Promise<AppManifest[]>,
};
