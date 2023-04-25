import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useReplacedURI } from "@ledgerhq/live-common/hooks/recoverFeatueFlag";

const featureName = "protectServicesDesktop";

export function usePostOnboardingURI(): string | undefined {
  const servicesConfig = useFeature(featureName);

  const uri = servicesConfig?.params?.onboardingRestore?.postOnboardingURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellURI(): string | undefined {
  const servicesConfig = useFeature(featureName);

  const uri = servicesConfig?.params?.onboardingCompleted?.upsellURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAlreadySubscribedURI(): string | undefined {
  const servicesConfig = useFeature(featureName);

  const uri = servicesConfig?.params?.onboardingCompleted?.alreadySubscribedURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}
