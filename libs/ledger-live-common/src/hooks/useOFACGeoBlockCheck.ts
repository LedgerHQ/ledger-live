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
      // for dev & QA testing purpose -> To delete when test phases are over
      const res = await fetch("https://countervalues-service.api.ledger-test.com/", {
        method: "POST",
        headers: {
          "x-ledger-ofac-test": `${!!(platformOfacGeoBlocking as any)?.isOfacRegion}`, // This header is used to simulate the OFAC region for testing purposes
        },
      });
      return res.status === 451;
      /**
       * To be used in production after QA validation
       * const res = await fetch(`${baseURL()}/v3/market`);
       * return res.status === 451;
       * }
       */
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
