import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useMemo } from "react";

function useReplacedURI(uri?: string, id?: string) {
  return useMemo(() => {
    return uri && id ? uri.replace("protect-simu", id) : undefined;
  }, [id, uri]);
}

export function usePostOnboardingURI(): string | undefined {
  const servicesConfig = useFeature("protectServicesMobile");

  const uri = servicesConfig?.params?.onboardingRestore?.postOnboardingURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useLearnMoreURI(): string | undefined {
  const servicesConfig = useFeature("protectServicesMobile");

  const uri = servicesConfig?.params?.managerStatesData?.NEW?.learnMoreURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAlreadySubscribedURI(): string | undefined {
  const servicesConfig = useFeature("protectServicesMobile");

  const uri =
    servicesConfig?.params?.managerStatesData?.NEW?.alreadySubscribedURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}
