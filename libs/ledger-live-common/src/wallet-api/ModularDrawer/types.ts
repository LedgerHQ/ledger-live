import { z } from "zod";

export type ModularDrawerConfiguration = {
  assets?: {
    customTitle?: string;
    customDescription?: string;
    filter?: string;
    leftElement?: string;
    rightElement?: string;
  };
  networks?: {
    customTitle?: string;
    customDescription?: string;
    rightElement?: string;
    leftElement?: string;
  };
  sortKey?: string;
};

export const filterOptions = ["topNetworks", "undefined"] as const;
export const assetsLeftElementOptions = ["apy", "marketTrend", "undefined"] as const;
export const assetsRightElementOptions = ["balance", "marketTrend", "undefined"] as const;
export const networksLeftElementOptions = [
  "numberOfAccounts",
  "numberOfAccountsAndApy",
  "undefined",
] as const;
export const networksRightElementOptions = ["balance", "undefined"] as const;

export const EnhancedModularDrawerConfigurationSchema = z.object({
  assets: z
    .object({
      customTitle: z.string().optional(),
      customDescription: z.string().optional(),
      filter: z.enum(filterOptions).optional(),
      leftElement: z.enum(assetsLeftElementOptions).optional(),
      rightElement: z.enum(assetsRightElementOptions).optional(),
    })
    .optional(),
  networks: z
    .object({
      customTitle: z.string().optional(),
      customDescription: z.string().optional(),
      leftElement: z.enum(networksLeftElementOptions).optional(),
      rightElement: z.enum(networksRightElementOptions).optional(),
    })
    .optional(),
  sortKey: z.string().optional(),
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
