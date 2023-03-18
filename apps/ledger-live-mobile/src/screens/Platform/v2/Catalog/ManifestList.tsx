import React from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { AppCard } from "./AppCard";

export function ManifestList({
  manifests,
  onSelect,
}: {
  manifests: LiveAppManifest[];
  onSelect: (manifest: LiveAppManifest) => void;
}) {
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
