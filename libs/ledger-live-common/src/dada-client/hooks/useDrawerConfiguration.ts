import { useCallback } from "react";
import useFeature from "../../featureFlags/useFeature";
import { ModularDrawerConfiguration } from "wallet-api/ModularDrawer/types";

interface DrawerConfiguration {
  assets?: ModularDrawerConfiguration["assets"];
  networks?: ModularDrawerConfiguration["networks"];
}

interface UseCaseConfig {
  assets?: ModularDrawerConfiguration["assets"];
  networks?: ModularDrawerConfiguration["networks"];
}

type UseCaseConfigs = Record<string, UseCaseConfig>;

/**
 * Hook that provides drawer configuration functionality with feature flag integration.
 *
 * @returns An object containing the createDrawerConfiguration function
 */
export function useDrawerConfiguration() {
  const earnDrawerConfigurationFlag = useFeature("ptxEarnDrawerConfiguration");

  const createDrawerConfiguration = useCallback(
    (
      drawerConfiguration: DrawerConfiguration,
      useCase: string | undefined, // FIXME: use the real types from the wallet-api/ModularDrawer/types.ts
      customUseCaseConfigs?: UseCaseConfigs,
    ): DrawerConfiguration => {
      const config: DrawerConfiguration | undefined = drawerConfiguration!;

      // Default use case configs with earn configuration from feature flag
      const earnAppDrawerConfig: UseCaseConfig =
        earnDrawerConfigurationFlag?.enabled && earnDrawerConfigurationFlag.params
          ? earnDrawerConfigurationFlag.params
          : {};

      const defaultUseCaseConfigs: UseCaseConfigs = {
        earn: earnAppDrawerConfig,
      };

      // Merge with any custom use case configs provided
      const useCaseConfigs = {
        ...defaultUseCaseConfigs,
        ...customUseCaseConfigs,
      };

      const useCaseConfig = useCase ? useCaseConfigs[useCase] : undefined;

      return {
        assets: {
          ...useCaseConfig?.assets,
          ...config?.assets,
        },
        networks: {
          ...useCaseConfig?.networks,
          ...config?.networks,
        },
      };
    },
    [earnDrawerConfigurationFlag],
  );

  return { createDrawerConfiguration };
}
