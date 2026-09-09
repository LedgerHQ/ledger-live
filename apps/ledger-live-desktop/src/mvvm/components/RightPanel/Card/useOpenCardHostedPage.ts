import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import useEnv from "@features/platform-env";
import type { OpenHostedLogin } from "@features/flow-pay-card-auth";

const PAY_TAB_PATH = "/paytab";

export function useOpenCardHostedPage(): OpenHostedLogin {
  const navigate = useNavigate();
  const hostedUiUrl = useEnv("CARD_BAANX_HOSTED_UI");
  const flagParams = useFeature("lwdPayTab")?.params;

  const params = useMemo(
    () => ({ ...FEATURE_FLAGS_DEFAULTS.lwdPayTab.params, ...flagParams }),
    [flagParams],
  );

  return useCallback(
    async (pageUrl: string) => {
      const isHostedPage = pageUrl.startsWith(hostedUiUrl);
      const manifestId = isHostedPage
        ? params.baanx_hosted_manifest_id
        : params.baanx_login_manifest_id;

      if (!manifestId) {
        throw new Error("useOpenCardHostedPage: lwdPayTab carries no manifest id");
      }

      const state = isHostedPage
        ? { goToURL: pageUrl }
        : Object.fromEntries(new URL(pageUrl).searchParams);

      navigate(`/platform/${manifestId}?returnTo=${encodeURIComponent(PAY_TAB_PATH)}`, { state });

      return { type: "pending" };
    },
    [navigate, hostedUiUrl, params],
  );
}
