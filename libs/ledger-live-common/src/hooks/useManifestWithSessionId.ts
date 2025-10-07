import React from "react";
import { appendQueryParamsToManifestURL } from "../wallet-api/utils/appendQueryParamsToManifestURL";
import { LiveAppManifest } from "../platform/types";
import { getEnv } from "@ledgerhq/live-env";

type Options = {
  manifest: LiveAppManifest | null | undefined;
  shareAnalytics: boolean;
};

type HookResult = {
  manifest?: LiveAppManifest | null;
  loading: boolean;
};

export function useManifestWithSessionId({ manifest, shareAnalytics }: Options): HookResult {
  const [id, setId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchId() {
      if (!shareAnalytics || !manifest) {
        setId(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(getEnv("PROVIDER_SESSION_ID_ENDPOINT"), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch session ID");

        const { providerSessionId } = await response.json();

        if (!cancelled) {
          setId(providerSessionId);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setId(null);
          setLoading(false);
        }
      }
    }

    fetchId();

    return () => {
      cancelled = true; // avoid setting state after unmount
    };
  }, [shareAnalytics]);

  const customizedManifest = React.useMemo(() => {
    if (!manifest) return null;

    if (loading) {
      return null;
    }

    if (id) {
      const url = appendQueryParamsToManifestURL(manifest, {
        externalID: id,
      });

      return url ? { ...manifest, url: url.toString() } : manifest;
    }

    return manifest;
  }, [manifest, id, loading]);

  return { manifest: customizedManifest, loading };
}
