import { useEffect, useMemo, useState } from "react";
import { useFeature } from "../featureFlags";
import { useQuery } from "@tanstack/react-query";
import { getEnv } from "@ledgerhq/live-env";

const baseURL = () => getEnv("LEDGER_COUNTERVALUES_API");

export const useOFACGeoBlockCheck = ({
  onFinish,
  geoBlockingFeatureFlagKey,
  enabled,
}: {
  onFinish?: () => void;
  geoBlockingFeatureFlagKey: "llmOfacGeoBlocking" | "lldOfacGeoBlocking";
  enabled?: boolean;
}) => {
  const [blocked, setBlocked] = useState<boolean>(false);

  const platformOfacGeoBlocking = useFeature(geoBlockingFeatureFlagKey);

  const { data, isSuccess } = useQuery({
    queryKey: ["ofac-geo-block", geoBlockingFeatureFlagKey],
    enabled,
    queryFn: async () => {
      if (!platformOfacGeoBlocking?.enabled) return false;
      const res = await fetch(`${baseURL()}/v3/markets`);
      return res.status === 451;
    },
  });

  useEffect(() => {
    if (!platformOfacGeoBlocking?.enabled || !isSuccess) return;
    setBlocked(data ?? false);
    if (typeof onFinish === "function") {
      onFinish();
    }
  }, [data, isSuccess, onFinish, platformOfacGeoBlocking]);

  return useMemo(() => ({ blocked, isLoading: !isSuccess }), [blocked, isSuccess]);
};
