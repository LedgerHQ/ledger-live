import { useMemo, useCallback } from "react";
import { LiveAppManifest, LiveAppManifestParams } from "@ledgerhq/live-common/platform/types";
import { LiveAppManifestParamsDapp } from "@ledgerhq/live-common/platform/types";
import { RecentlyUsedManifest } from "@ledgerhq/live-common/wallet-api/react";
import { PropsCard } from "./types";

const hasDappUrl = (params: LiveAppManifestParams): params is LiveAppManifestParamsDapp => {
  return "dappUrl" in params;
};

export function useCard({
  manifest,
  onClick: onClickProp,
}: PropsCard<RecentlyUsedManifest> | PropsCard<LiveAppManifest>) {
  let url = manifest.url;
  if (manifest.params && hasDappUrl(manifest.params)) {
    url = manifest.params.dappUrl;
  }

  const hostname = useMemo(() => new URL(url).hostname.replace("www.", ""), [url]);

  const onClick = useCallback(() => {
    onClickProp(manifest);
  }, [onClickProp, manifest]);

  return {
    hostname,
    disabled: manifest.branch === "soon",
    onClick,
    ...("usedAt" in manifest ? { usedAt: manifest.usedAt } : {}),
  };
}
