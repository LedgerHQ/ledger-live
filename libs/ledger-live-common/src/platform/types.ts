import type { SignedOperation } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountFilters, CurrencyFilters } from "./filters";
import {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
  FAMILIES,
} from "@ledgerhq/live-app-sdk";
import { z } from "zod";
import { reverseRecord } from "../helpers";

export const FAMILIES_MAPPING_PLATFORM_TO_LL = {
  ethereum: "evm",
  ripple: "xrp",
} as const;

export const FAMILIES_MAPPING_LL_TO_PLATFORM = reverseRecord(FAMILIES_MAPPING_PLATFORM_TO_LL);

/**
 * this is a hack to add the "evm" family to the list of supported families of
 * the deprecated @ledgerhq/live-app-sdk, still used by some live apps.
 * Since "evm" will be (is) the new family of original currencies under the
 * "ethereum" family, following the "ethereum" / "evm" families merge
 * (and removal of the "ethereum" family)
 */
export const PLATFORM_FAMILIES = [
  ...Object.values(FAMILIES),
  ...Object.values(FAMILIES_MAPPING_PLATFORM_TO_LL),
];

export { FAMILIES as PLATFORM_FAMILIES_ENUM };

export type {
  Account as PlatformAccount,
  Currency as PlatformCurrency,
  Unit as PlatformUnit,
  Transaction as PlatformTransaction,
  CryptoCurrency as PlatformCryptoCurrency,
  ERC20TokenCurrency as PlatformERC20TokenCurrency,
} from "@ledgerhq/live-app-sdk";

export {
  CurrencyType as PlatformCurrencyType,
  TokenStandard as PlatformTokenStandard,
} from "@ledgerhq/live-app-sdk";

export type TranslatableString = {
  en: string;
  [locale: string]: string;
};

export type Loadable<T> = {
  error: any | null;
  isLoading: boolean;
  value: T | null;
};

export type AppPlatform = "ios" | "android" | "desktop";

export type AppBranch = "stable" | "experimental" | "soon" | "debug";
export type Visibility = "complete" | "searchable" | "deep";

export type ParamsWithDappUrl = {
  dappUrl: string;
};

export type ParamsWithNetwork = {
  networks: Array<LiveAppManifestParamsNetwork>;
};

export type LiveAppManifestParamsDappWithNetwork = ParamsWithDappUrl & ParamsWithNetwork;
export type LiveAppManifestParamsDappWithNetworkAndNanoApp =
  LiveAppManifestParamsDappWithNetwork & {
    nanoApp: string;
    dappName: string;
  };

export type LiveAppManifestParamsDapp =
  | LiveAppManifestParamsDappWithNetwork
  | LiveAppManifestParamsDappWithNetworkAndNanoApp;

export type LiveAppManifestParamsWebApp = {
  currencies: string[];
  webAppName: string;
  webUrl: string;
};

export type LiveAppManifestParams =
  | LiveAppManifestParamsDapp
  | LiveAppManifestParamsWebApp
  | ParamsWithNetwork
  | Array<string>;

export type LiveAppManifestParamsNetwork = {
  currency: string;
  chainID: number;
  nodeURL?: string;
};

export type DappProviders = "evm";

export type LiveAppManifestDapp = {
  provider: DappProviders;
  networks: Array<LiveAppManifestParamsNetwork>;
  nanoApp: string;
  dependencies?: string[];
};

export type LiveAppManifest = {
  id: string;
  author?: string;
  private?: boolean;
  cacheBustingId?: number;
  nocache?: boolean;
  name: string;
  url: string | URL;
  params?: LiveAppManifestParams;
  dapp?: LiveAppManifestDapp;
  homepageUrl: string;
  supportUrl?: string;
  icon?: string | null;
  platforms: AppPlatform[];
  apiVersion: string;
  manifestVersion: string;
  branch: AppBranch;
  permissions: string[];
  domains: string[];
  categories: string[];
  currencies: string[] | "*";
  visibility: Visibility;
  highlight?: boolean;
  featureFlags?: string[] | "*";
  storage?: string[];
  providerTestBaseUrl?: string;
  providerTestId?: string;
  content: {
    cta?: TranslatableString;
    subtitle?: TranslatableString;
    shortDescription: TranslatableString;
    description: TranslatableString;
  };
};

export const DappProvidersSchema = z.enum(["evm"]);

export const LiveAppManifestParamsNetworkSchema = z.object({
  currency: z.string().min(1),
  chainID: z.number(),
  nodeURL: z.string().optional(),
});

export const LiveAppManifestDappSchema = z.object({
  provider: DappProvidersSchema,
  networks: z.array(LiveAppManifestParamsNetworkSchema),
  nanoApp: z.string().min(1),
  dependencies: z.array(z.string()).optional(),
});

export const LiveAppManifestSchema = z
  .object({
    id: z.string().trim().min(1),
    author: z.string().optional(),
    private: z.boolean().optional(),
    cacheBustingId: z.number().optional(),
    nocache: z.boolean().optional(),
    name: z.string().trim().min(1),
    url: z.string().trim().min(1),
    dapp: LiveAppManifestDappSchema.optional(),
    homepageUrl: z.string().trim().min(1),
    supportUrl: z.string().optional(),
    icon: z.string().nullable().optional(),
    platforms: z.array(z.enum(["ios", "android", "desktop"])).min(1),
    apiVersion: z.string().trim().min(1),
    manifestVersion: z.string().trim().min(1),
    branch: z.enum(["stable", "experimental", "soon", "debug"]),
    permissions: z.array(z.string().trim()).optional(),
    domains: z.array(z.string().trim()).min(1),
    categories: z.array(z.string().trim()).min(1),
    currencies: z.union([z.array(z.string().trim()).min(1), z.literal("*")]),
    visibility: z.enum(["complete", "searchable", "deep"]),
    highlight: z.boolean().optional(),
    featureFlags: z.union([z.array(z.string().trim()), z.literal("*")]).optional(),
    content: z.object({
      cta: z.record(z.string()).optional(),
      subtitle: z.record(z.string()).optional(),
      shortDescription: z.record(z.string().trim().min(1)),
      description: z.record(z.string().trim().min(1)),
    }),
  })
  .strict();

export type LiveAppManifestSchemaType = z.infer<typeof LiveAppManifestSchema>;

export type PlatformApi = {
  fetchManifest: () => Promise<LiveAppManifest[]>;
};

export type PlatformSignedTransaction = SignedOperation;

export type ListPlatformAccount = (filters?: AccountFilters) => PlatformAccount[];

export type ListPlatformCurrency = (filters?: CurrencyFilters) => Promise<PlatformCurrency[]>;

export type PlatformSupportedCurrency = CryptoCurrency | TokenCurrency;
