import { useMemo } from "react";
import { Feature } from "@ledgerhq/types-live";

export function useReplacedURI(uri?: string, id?: string): string | undefined {
  return useMemo(() => {
    return uri && id ? uri.replace("protect-simu", id) : undefined;
  }, [id, uri]);
}

function usePath(servicesConfig: Feature<any> | null, uri?: string) {
  return useMemo(() => {
    return servicesConfig?.enabled ? uri?.replace("ledgerlive://", "/") : undefined;
  }, [servicesConfig?.enabled, uri]);
}

export function usePostOnboardingURI(servicesConfig: Feature<any> | null): string | undefined {
  const uri = servicesConfig?.params?.onboardingRestore?.postOnboardingURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function usePostOnboardingPath(servicesConfig: Feature<any> | null): string | undefined {
  const uri = usePostOnboardingURI(servicesConfig);

  return usePath(servicesConfig, uri);
}

export function useLearnMoreURI(servicesConfig: Feature<any> | null): string | undefined {
  const uri = servicesConfig?.params?.managerStatesData?.NEW?.learnMoreURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useAlreadySubscribedURI(servicesConfig: Feature<any> | null): string | undefined {
  const uri = servicesConfig?.params?.managerStatesData?.NEW?.alreadySubscribedURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellURI(servicesConfig: Feature<any> | null): string | undefined {
  const uri = servicesConfig?.params?.onboardingCompleted?.upsellURI;
  const id = servicesConfig?.params?.protectId;

  return useReplacedURI(uri, id);
}

export function useUpsellPath(servicesConfig: Feature<any> | null): string | undefined {
  const uri = useUpsellURI(servicesConfig);

  return usePath(servicesConfig, uri);
}
