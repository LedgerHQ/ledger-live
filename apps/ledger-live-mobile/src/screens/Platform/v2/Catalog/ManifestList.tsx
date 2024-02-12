import React from "react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { AppCard } from "./AppCard";
import { Disclaimer } from "../hooks";

export function ManifestList({
  manifests,
  onSelect,
}: {
  manifests: AppManifest[];
  onSelect: Disclaimer["onSelect"];
}) {
  return (
    <>
      {manifests.map(m => (
        <AppCard key={`${m.id}.${m.branch}`} manifest={m} onPress={onSelect} />
      ))}
    </>
  );
}
