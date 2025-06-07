import {
  type EnhancedModularDrawerConfiguration,
  type ModularDrawerConfiguration,
  EnhancedModularDrawerConfigurationSchema,
} from "./types";

export const defaultDrawerConfiguration: EnhancedModularDrawerConfiguration = {
  assets: {
    rightElement: "balance",
  },
  networks: {
    leftElement: "numberOfAccounts",
  },
};

export function validateAndTransformConfigurationWithZod(
  config?: ModularDrawerConfiguration | EnhancedModularDrawerConfiguration,
): EnhancedModularDrawerConfiguration {
  const result = EnhancedModularDrawerConfigurationSchema.safeParse(config);

  if (!result.success) {
    console.warn("Modular Drawer invalid configuration received:", result.error);
    return {};
  }

  return result.data;
}

export function createModularDrawerConfiguration(
  config?: ModularDrawerConfiguration | EnhancedModularDrawerConfiguration,
): EnhancedModularDrawerConfiguration {
  const validatedConfig = validateAndTransformConfigurationWithZod(config);
  return {
    ...defaultDrawerConfiguration,
    ...validatedConfig,
  } satisfies EnhancedModularDrawerConfiguration;
}
