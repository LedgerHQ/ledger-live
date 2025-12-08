import { z } from "zod";

export type ModularDrawerConfiguration = {
  assets?: {
    filter?: string;
    leftElement?: string;
    rightElement?: string;
  };
  networks?: {
    rightElement?: string;
    leftElement?: string;
  };
};

export const filterOptions = ["topNetworks", "undefined"] as const;
export const assetsLeftElementOptions = ["apy", "marketTrend", "undefined"] as const;
export const assetsRightElementOptions = ["balance", "marketTrend", "undefined"] as const;
export const networksLeftElementOptions = [
  "numberOfAccounts",
  "numberOfAccountsText",
  "numberOfAccountsAndApy",
  "undefined",
] as const;
export const networksRightElementOptions = ["balance", "undefined"] as const;

export const EnhancedModularDrawerConfigurationSchema = z.object({
  assets: z
    .object({
      filter: z.enum(filterOptions).optional(),
      leftElement: z.enum(assetsLeftElementOptions).optional(),
      rightElement: z.enum(assetsRightElementOptions).optional(),
    })
    .optional(),
  networks: z
    .object({
      leftElement: z.enum(networksLeftElementOptions).optional(),
      rightElement: z.enum(networksRightElementOptions).optional(),
    })
    .optional(),
});

/**
 * Enhanced configuration for the modular drawer.
 * Extends the base configuration by allowing customization of `assets` and `networks` properties.
 */
export type EnhancedModularDrawerConfiguration = Omit<
  ModularDrawerConfiguration,
  "assets" | "networks"
> &
  z.infer<typeof EnhancedModularDrawerConfigurationSchema>;
