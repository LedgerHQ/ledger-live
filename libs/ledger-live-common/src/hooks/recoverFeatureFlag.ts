import { useMemo } from "react";
import type { Feature, Features } from "@shared/feature-flags";

// Matches any `protect-<env>` segment so changing `protectId` re-templates every URI.
const PROTECT_ID_SEGMENT_REGEX = /protect-[a-z0-9-]+/g;

export function useReplacedURI(uri?: string, id?: string): string | undefined {
  return useMemo(() => {
    return uri && id ? uri.replace(PROTECT_ID_SEGMENT_REGEX, id) : undefined;
  }, [id, uri]);
}

function usePath(servicesConfig: Feature<unknown> | null, uri?: string) {
  return useMemo(() => {
    return servicesConfig?.enabled ? uri?.replace("ledgerlive://", "/") : undefined;
  }, [servicesConfig?.enabled, uri]);
}

export function usePostOnboardingURI(
  servicesConfig: Features["protectServicesMobile"] | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingRestore?.postOnboardingURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useQuickAccessURI(
  servicesConfig: Features["protectServicesMobile"] | null,
): string | undefined {
  const uri = servicesConfig?.params?.managerStatesData?.NEW?.quickAccessURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAlreadyOnboardedURI(
  servicesConfig: Features["protectServicesMobile"] | null,
): string | undefined {
  const uri = servicesConfig?.params?.managerStatesData?.NEW?.alreadyOnboardedURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useHomeURI(
  servicesConfig: Features["protectServicesMobile"] | null,
): string | undefined {
  const uri = servicesConfig?.params?.account?.homeURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellURI(
  servicesConfig: Features["protectServicesDesktop"] | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingCompleted?.upsellURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellPath(
  servicesConfig: Features["protectServicesDesktop"] | null,
): string | undefined {
  const uri = useUpsellURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useRestore24URI(
  servicesConfig: Features["protectServicesDesktop"] | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingCompleted?.restore24URI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useRestore24Path(
  servicesConfig: Features["protectServicesDesktop"] | null,
): string | undefined {
  const uri = useRestore24URI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useAccountURI(
  servicesConfig: Features["protectServicesDesktop"] | null,
): string | undefined {
  const uri = servicesConfig?.params?.account?.homeURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAccountPath(
  servicesConfig: Features["protectServicesDesktop"] | null,
): string | undefined {
  const uri = useAccountURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useAlreadySeededDeviceURI(
  servicesConfig: Features["protectServicesDesktop"] | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingCompleted?.alreadyDeviceSeededURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAlreadySeededDevicePath(
  servicesConfig: Features["protectServicesDesktop"] | null,
): string | undefined {
  const uri = useAlreadySeededDeviceURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useCustomURI(
  servicesConfig: Features["protectServicesDesktop"] | Features["protectServicesMobile"] | null,
  page?: string,
  source?: string,
  deeplinkCampaign?: string,
): string | undefined {
  const customUri = useMemo(() => {
    const id = servicesConfig?.params?.protectId;
    const basicUri = id ? `ledgerlive://recover/${id}` : "ledgerlive://recover/protect-prod";
    const uri = new URL(basicUri);

    if (page) uri.searchParams.append("redirectTo", page);
    if (source) uri.searchParams.append("source", source);
    if (source && deeplinkCampaign) {
      uri.searchParams.append("ajs_recover_source", source);
      uri.searchParams.append("ajs_recover_campaign", deeplinkCampaign);
      uri.searchParams.append("ajs_prop_source", source);
      uri.searchParams.append("ajs_prop_campaign", deeplinkCampaign);
    }

    return uri;
  }, [deeplinkCampaign, page, servicesConfig?.params?.protectId, source]);

  return customUri.toString();
}

export function useCustomPath(
  servicesConfig: Features["protectServicesDesktop"] | Features["protectServicesMobile"] | null,
  page?: string,
  source?: string,
  deeplinkCampaign?: string,
): string | undefined {
  const uri = useCustomURI(servicesConfig, page, source, deeplinkCampaign);

  return usePath(servicesConfig, uri);
}

export enum Source {
  LLM_ONBOARDING_24 = "llm-onboarding-24",
  LLD_ONBOARDING_24 = "lld-onboarding-24",
}

export function useTouchScreenOnboardingUpsellURI(
  servicesConfig: Features["protectServicesDesktop"] | Features["protectServicesMobile"] | null,
  source: Source,
): string | undefined {
  const campaign = "touchscreen-onboarding";
  return useCustomURI(servicesConfig, "upsell", source, campaign);
}

export function useTouchScreenOnboardingUpsellPath(
  servicesConfig: Features["protectServicesDesktop"] | Features["protectServicesMobile"] | null,
  source: Source,
): string | undefined {
  const uri = useTouchScreenOnboardingUpsellURI(servicesConfig, source);

  return usePath(servicesConfig, uri);
}
