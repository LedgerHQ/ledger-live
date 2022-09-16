import type { AppManifest } from "../types";
import { getEnv } from "../../env";

export function mergeManifestLists(
  list1: AppManifest[],
  list2: AppManifest[]
): AppManifest[] {
  const newIds = new Set(list2.map((elem) => elem.id));
  return [...list1.filter((elem) => !newIds.has(elem.id)), ...list2];
}

export const initializeLocalManifest = (): Map<string, AppManifest> => {
  const localManifestJsonRaw: string | null | undefined = getEnv(
    "PLATFORM_LOCAL_MANIFEST_JSON"
  );

  if (!localManifestJsonRaw) {
    return new Map();
  }

  try {
    const manifest: AppManifest | [AppManifest] =
      JSON.parse(localManifestJsonRaw);

    const manifestArray = Array.isArray(manifest) ? manifest : [manifest];

    const map = new Map(manifestArray.map((m) => [m.id, m]));

    return map;
  } catch (error) {
    /**
     * Probable error during `JSON.parse` call, log error and return empty map
     * as if env variable was not defined
     */
    console.error(error);
    return new Map();
  }
};
