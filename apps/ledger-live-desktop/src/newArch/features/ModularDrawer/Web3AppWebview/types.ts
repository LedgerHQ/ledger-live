import { ModularDrawerConfiguration as BaseModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/types";
import { z } from "zod";

const filterOptions = ["topNetworks"] as const;
const assetsLeftElementOptions = ["apy", "priceVariation"] as const;
const assetsRightElementOptions = ["balance", "marketTrend"] as const;
const networksLeftElementOptions = ["numberOfAccounts", "numberOfAccountsAndApy"] as const;
const networksRightElementOptions = ["balance"] as const;

export type FILTER_PARAMS = (typeof filterOptions)[number];
export type ASSETS_LEFT_ELEMENT_PARAMS = (typeof assetsLeftElementOptions)[number];
export type ASSETS_RIGHT_ELEMENT_PARAMS = (typeof assetsRightElementOptions)[number];
export type NETWORKS_LEFT_ELEMENT_PARAMS = (typeof networksLeftElementOptions)[number];
export type NETWORKS_RIGHT_ELEMENT_PARAMS = (typeof networksRightElementOptions)[number];

/**
 * Enhanced configuration for the modular drawer.
 * Extends the base configuration by allowing customization of `assets` and `networks` properties.
 */
export type EnhancedModularDrawerConfiguration = Omit<
  BaseModularDrawerConfiguration,
  "assets" | "networks"
> & {
  assets?: {
    filter?: FILTER_PARAMS;
    leftElement?: ASSETS_LEFT_ELEMENT_PARAMS;
    rightElement?: ASSETS_RIGHT_ELEMENT_PARAMS;
  };
  networks?: {
    rightElement?: NETWORKS_RIGHT_ELEMENT_PARAMS;
    leftElement?: NETWORKS_LEFT_ELEMENT_PARAMS;
  };
};

export type ModularDrawerConfiguration = BaseModularDrawerConfiguration;

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
