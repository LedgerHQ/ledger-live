import { useMemo } from "react";
import {
  Feature,
  Feature_ProtectServicesDesktop,
  Feature_ProtectServicesMobile,
} from "@ledgerhq/types-live";

export function useReplacedURI(uri?: string, id?: string): string | undefined {
  return useMemo(() => {
    return uri && id ? uri.replace(/protect-(simu|local-dev|staging)/, id) : undefined;
  }, [id, uri]);
}

function usePath(servicesConfig: Feature<unknown> | null, uri?: string) {
  return useMemo(() => {
    return servicesConfig?.enabled ? uri?.replace("ledgerlive://", "/") : undefined;
  }, [servicesConfig?.enabled, uri]);
}

export function usePostOnboardingURI(
  servicesConfig: Feature_ProtectServicesDesktop | Feature_ProtectServicesMobile | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingRestore?.postOnboardingURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useQuickAccessURI(
  servicesConfig: Feature_ProtectServicesMobile | null,
): string | undefined {
  const uri = servicesConfig?.params?.managerStatesData?.NEW?.quickAccessURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAlreadyOnboardedURI(
  servicesConfig: Feature_ProtectServicesMobile | null,
): string | undefined {
  const uri = servicesConfig?.params?.managerStatesData?.NEW?.alreadyOnboardedURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useHomeURI(
  servicesConfig: Feature_ProtectServicesMobile | null,
): string | undefined {
  const uri = servicesConfig?.params?.account?.homeURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellURI(
  servicesConfig: Feature_ProtectServicesDesktop | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingCompleted?.upsellURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellPath(
  servicesConfig: Feature_ProtectServicesDesktop | null,
): string | undefined {
  const uri = useUpsellURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useRestore24URI(
  servicesConfig: Feature_ProtectServicesDesktop | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingCompleted?.restore24URI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useRestore24Path(
  servicesConfig: Feature_ProtectServicesDesktop | null,
): string | undefined {
  const uri = useRestore24URI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useAccountURI(
  servicesConfig: Feature_ProtectServicesDesktop | null,
): string | undefined {
  const uri = servicesConfig?.params?.account?.homeURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAccountPath(
  servicesConfig: Feature_ProtectServicesDesktop | null,
): string | undefined {
  const uri = useAccountURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useAlreadySeededDeviceURI(
  servicesConfig: Feature_ProtectServicesDesktop | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingCompleted?.alreadyDeviceSeededURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAlreadySeededDevicePath(
  servicesConfig: Feature_ProtectServicesDesktop | null,
): string | undefined {
  const uri = useAlreadySeededDeviceURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useCustomURI(
  servicesConfig: Feature_ProtectServicesDesktop | Feature_ProtectServicesMobile | null,
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
  servicesConfig: Feature_ProtectServicesDesktop | Feature_ProtectServicesMobile | null,
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
  servicesConfig: Feature_ProtectServicesDesktop | Feature_ProtectServicesMobile | null,
  source: Source,
): string | undefined {
  const campaign = "touchscreen-onboarding";
  return useCustomURI(servicesConfig, "upsell", source, campaign);
}

export function useTouchScreenOnboardingUpsellPath(
  servicesConfig: Feature_ProtectServicesDesktop | Feature_ProtectServicesMobile | null,
  source: Source,
): string | undefined {
  const uri = useTouchScreenOnboardingUpsellURI(servicesConfig, source);

  return usePath(servicesConfig, uri);
}
