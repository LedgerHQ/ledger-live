import type { CryptoCurrencyIds } from "../../types";
import type { EnvName } from "../../env";

export type EndpointConfig = {
  // define the env name to get the url from. e.g. EXPLORER
  base: EnvName;
  // define the version to use with. e.g. v2, v3
  version: string;
};

export type Config = {
  // this is the explorer id of a currency. it is called ticker in explorer's side, but it's not like the coin ticker. it's an ID used only by Ledger's explorer
  id: string;
  // defines the stable endpoint set up to use
  stable: EndpointConfig;
  // if defined, a staging version is available
  experimental?: EndpointConfig;
};

export type FullConfig = Record<CryptoCurrencyIds, Config | null | undefined>;

export type EndpointConfigOverrides = {
  version?: string;
  overrides_X_out_of_100?: number;
};

export type ConfigOverrides = {
  stable?: EndpointConfigOverrides;
  experimental?: EndpointConfigOverrides;
};

export type FullConfigOverrides = Record<string, ConfigOverrides>;
