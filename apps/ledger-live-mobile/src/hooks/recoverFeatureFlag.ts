import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useReplacedURI } from "@ledgerhq/live-common/hooks/recoverFeatueFlag";

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
