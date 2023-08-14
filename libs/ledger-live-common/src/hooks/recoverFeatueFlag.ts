import { useMemo } from "react";
import { Feature } from "@ledgerhq/types-live";
import { defaultFeatures } from "../featureFlags";

type DesktopFeature = (typeof defaultFeatures)["protectServicesDesktop"]["params"];
type MobileFeature = (typeof defaultFeatures)["protectServicesMobile"]["params"];

export function useReplacedURI(uri?: string, id?: string): string | undefined {
  return useMemo(() => {
    return uri && id ? uri.replace("protect-simu", id) : undefined;
  }, [id, uri]);
}

function usePath(servicesConfig: Feature<unknown> | null, uri?: string) {
  return useMemo(() => {
    return servicesConfig?.enabled ? uri?.replace("ledgerlive://", "/") : undefined;
  }, [servicesConfig?.enabled, uri]);
}

export function usePostOnboardingURI(
  servicesConfig: Feature<MobileFeature | DesktopFeature> | null,
): string | undefined {
  const uri = servicesConfig?.params?.onboardingRestore?.postOnboardingURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function usePostOnboardingPath(
  servicesConfig: Feature<DesktopFeature> | null,
): string | undefined {
  const uri = usePostOnboardingURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useLearnMoreURI(servicesConfig: Feature<MobileFeature> | null): string | undefined {
  const uri = servicesConfig?.params?.managerStatesData?.NEW?.learnMoreURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAlreadySubscribedURI(
  servicesConfig: Feature<MobileFeature> | null,
): string | undefined {
  const uri = servicesConfig?.params?.managerStatesData?.NEW?.alreadySubscribedURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellURI(servicesConfig: Feature<DesktopFeature> | null): string | undefined {
  const uri = servicesConfig?.params?.onboardingCompleted?.upsellURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellPath(servicesConfig: Feature<DesktopFeature> | null): string | undefined {
  const uri = useUpsellURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useLoginURI(
  servicesConfig: Feature<MobileFeature | DesktopFeature> | null,
): string | undefined {
  const uri = servicesConfig?.params?.account?.loginURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useLoginPath(servicesConfig: Feature<DesktopFeature> | null): string | undefined {
  const uri = useLoginURI(servicesConfig);

  return usePath(servicesConfig, uri);
}
