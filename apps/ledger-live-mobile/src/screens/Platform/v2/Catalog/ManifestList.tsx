import React, { useMemo } from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Categories } from "@ledgerhq/live-common/wallet-api/react";
import { AppCard } from "./AppCard";
import { Disclaimer } from "../hooks";

export function ManifestList({
  categories,
  disclaimer: { onSelect },
}: {
  categories: Pick<Categories, "manifestsByCategories" | "selected">;
  disclaimer: Pick<Disclaimer, "onSelect">;
}) {
  const manifests = useMemo(
    () => categories.manifestsByCategories.get(categories.selected) || [],
    [categories],
  );
  return (
    <>
      {manifests.map((manifest: LiveAppManifest) => (
        <AppCard
          key={`${manifest.id}.${manifest.branch}`}
          manifest={manifest}
          onPress={onSelect}
        />
      ))}
    </>
  );
}
