import { protectStorageLogic } from "../../logic/storage";
import type { HandlerDeps } from "../types";

export function createStorageGetHandler(getDeps: () => HandlerDeps) {
  return (params) => {
    const { uiStorageGet, manifest } = getDeps();
    if (!uiStorageGet) {
      throw new Error("storage.get UI handler not configured");
    }
    return protectStorageLogic(manifest, uiStorageGet)(params);
  };
}

export function createStorageSetHandler(getDeps: () => HandlerDeps) {
  return (params) => {
    const { uiStorageSet, manifest } = getDeps();
    if (!uiStorageSet) {
      throw new Error("storage.set UI handler not configured");
    }
    return protectStorageLogic(manifest, uiStorageSet)(params);
  };
}
