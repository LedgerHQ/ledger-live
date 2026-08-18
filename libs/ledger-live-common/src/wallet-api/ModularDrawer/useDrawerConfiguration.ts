import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";

/*
 * Looser than ModularDrawerConfiguration in ./types.ts because both inputs are unvalidated at
 * runtime — one arrives as `unknown` over the wallet-api bridge, the other is a feature flag's
 * params. Narrowing them soundly means parsing through EnhancedModularDrawerConfigurationSchema,
 * which changes how a malformed config behaves.
 */
interface DrawerConfiguration {
  assets?: Record<string, unknown>;
  networks?: Record<string, unknown>;
}

interface UseCaseConfig {
  assets?: Record<string, unknown>;
  networks?: Record<string, unknown>;
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
      drawerConfiguration: unknown,
      useCase: string | undefined,
      customUseCaseConfigs?: UseCaseConfigs,
    ): DrawerConfiguration => {
      const config = drawerConfiguration as DrawerConfiguration | undefined;

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
