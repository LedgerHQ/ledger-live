import { useMemo } from "react";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { useFeature } from "@features/platform-feature-flags";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";

type ResolvedManifest = LiveAppManifest | null | undefined;

export type CardHostedManifests = {
  readonly login: ResolvedManifest;
  readonly hosted: ResolvedManifest;
};

export function useCardHostedManifests(): CardHostedManifests {
  const params = useFeature("lwdPayTab")?.params;
  const defaultParams = FEATURE_FLAGS_DEFAULTS.lwdPayTab.params;

  // A remote or overridden flag replaces the whole params object, so a partial one (e.g. only
  // `{ card: true }`) must still fall back to the registered default for the manifest ids.
  const login = useLiveAppManifest(
    params?.baanx_login_manifest_id ?? defaultParams?.baanx_login_manifest_id,
  );
  const hosted = useLiveAppManifest(
    params?.baanx_hosted_manifest_id ?? defaultParams?.baanx_hosted_manifest_id,
  );

  return useMemo(() => ({ login, hosted }), [login, hosted]);
}
