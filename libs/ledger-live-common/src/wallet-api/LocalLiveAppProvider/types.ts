import { LiveAppManifest } from "../../platform/types";
import { LocalLiveAppDB } from "../react";

export type LiveAppProviderProps = {
  children: React.ReactNode;
  db: LocalLiveAppDB;
};

export type LiveAppContextType = {
  state: LiveAppManifest[];
  addLocalManifest: (LiveAppManifest) => void;
  removeLocalManifestById: (string) => void;
  getLocalLiveAppManifestById: (string) => LiveAppManifest | undefined;
};
