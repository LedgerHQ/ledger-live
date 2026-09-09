import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import useEnv from "@features/platform-env";
import type { OpenHostedLogin } from "@features/flow-pay-card-auth";

const PAY_TAB_PATH = "/paytab";

export function useOpenCardHostedPage(): OpenHostedLogin {
  const navigate = useNavigate();
  const hostedUiUrl = useEnv("CARD_BAANX_HOSTED_UI");
  const payTabParams = useFeature("lwdPayTab")?.params;

  return useCallback(
    async (pageUrl: string) => {
      const manifestId = pageUrl.startsWith(hostedUiUrl)
        ? payTabParams?.baanx_hosted_manifest_id
        : payTabParams?.baanx_login_manifest_id;

      if (!manifestId) {
        throw new Error("useOpenCardHostedPage: lwdPayTab carries no manifest id");
      }

      navigate(`/platform/${manifestId}`, {
        state: { goToURL: pageUrl, returnTo: PAY_TAB_PATH },
      });

      return { type: "pending" };
    },
    [navigate, hostedUiUrl, payTabParams],
  );
}
