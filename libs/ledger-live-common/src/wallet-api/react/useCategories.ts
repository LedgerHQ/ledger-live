import { useMemo, useState, useCallback } from "react";
import { DISCOVER_INITIAL_CATEGORY } from "../constants";
import type { AppManifest } from "../types";
import type { Categories, CategoryId } from "./types";

export function useCategories(
  manifests: AppManifest[],
  initialCategory?: CategoryId | null,
): Categories {
  const [selected, setSelected] = useState(initialCategory || DISCOVER_INITIAL_CATEGORY);

  const reset = useCallback(() => {
    setSelected(DISCOVER_INITIAL_CATEGORY);
  }, []);

  const manifestsByCategories = useMemo(() => {
    const res = manifests.reduce(
      (res, manifest) => {
        manifest.categories.forEach(category => {
          const list = [...(res.get(category) ?? []), manifest];
          res.set(category, list);
        });

        return res;
      },
      new Map<string, AppManifest[]>().set("all", manifests),
    );

    return res;
  }, [manifests]);

  const categories = useMemo(() => [...manifestsByCategories.keys()], [manifestsByCategories]);

  return useMemo(
    () => ({
      categories,
      manifestsByCategories,
      selected,
      setSelected,
      reset,
    }),
    [categories, manifestsByCategories, selected, reset],
  );
}
