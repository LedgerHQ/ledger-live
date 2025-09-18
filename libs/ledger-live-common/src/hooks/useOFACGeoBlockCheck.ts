import { useEffect, useState } from "react";
import { useFeature } from "../featureFlags";
import { useQuery } from "@tanstack/react-query";
import { getEnv } from "@ledgerhq/live-env";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

export const useOFACGeoBlockCheck = ({
  onFinish,
  geoBlockingFeatureFlagKey,
}: {
  onFinish?: () => void;
  geoBlockingFeatureFlagKey: "llmOfacGeoBlocking" | "lldOfacGeoBlocking";
}) => {
  const [blocked, setBlocked] = useState<boolean>(false);

  const platformOfacGeoBlocking = useFeature(geoBlockingFeatureFlagKey);

  const { data, isLoading } = useQuery({
    queryKey: ["ofac-geo-block", geoBlockingFeatureFlagKey],
    queryFn: async () => {
      if (!platformOfacGeoBlocking?.enabled) return false;
      const res = await fetch(`${baseURL()}/v3/markets`);
      return res.status === 451;
    },
  });

  useEffect(() => {
    if (!platformOfacGeoBlocking?.enabled) return;
    setBlocked(data ?? false);
    if (typeof onFinish === "function") {
      onFinish();
    }
  }, [data, onFinish, platformOfacGeoBlocking]);

  return { blocked, isLoading };
};
