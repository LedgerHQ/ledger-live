import invariant from "invariant";
import type {
  FullConfig,
  EndpointConfig,
  Config,
  EndpointConfigOverrides,
  ConfigOverrides,
  FullConfigOverrides,
} from "./types";
import { getUserHashes } from "../../user";

export function applyEndpointConfigOverrides(
  config: EndpointConfig,
  overrides: EndpointConfigOverrides
): EndpointConfig {
  let { version } = overrides;
  const { overrides_X_out_of_100 } = overrides;

  if (!version) return config;

  if (typeof overrides_X_out_of_100 === "number") {
    const { endpointOverrides100 } = getUserHashes();

    if (endpointOverrides100 < overrides_X_out_of_100) {
      //^ in this case, we will "overrides" the config. it's ON.
    } else {
      version = config.version; // otherwise we don't override
    }
  }

  if (!version || config.version === version) return config; // nothing to change

  return { ...config, version };
}

export function applyConfigOverrides(
  config: Config,
  overrides: ConfigOverrides
): Config {
  const res: Config = {
    id: config.id,
    stable: config.stable,
  };

  if (config.experimental) {
    res.experimental = overrides.experimental
      ? applyEndpointConfigOverrides(
          config.experimental,
          overrides.experimental
        )
      : config.experimental;
  }

  if (config.stable) {
    res.stable = overrides.stable
      ? applyEndpointConfigOverrides(config.stable, overrides.stable)
      : config.stable;
  }

  if (
    config.experimental === res.experimental &&
    config.stable === res.stable
  ) {
    return config; // nothing changed
  }

  return res;
}

export function applyFullConfigOverrides(
  config: FullConfig,
  overrides: FullConfigOverrides
): FullConfig {
  let changed = false;
  const all = {};

  for (const k in config) {
    const c = config[k];
    const override = overrides[k];
    const o = override && c ? applyConfigOverrides(c, overrides[k]) : c;
    changed = changed || o !== c;
    all[k] = o;
  }

  return changed ? all : config;
}

export function asEndpointConfigOverrides(
  o?: EndpointConfigOverrides
): EndpointConfigOverrides {
  invariant(o && typeof o === "object", "EndpointConfig: not an object");
  const copy: EndpointConfigOverrides = {};

  if (o && "version" in o) {
    invariant(
      typeof o.version === "string",
      "endpointConfig.version should be string"
    );
    copy.version = o.version;
  }

  if (o && "overrides_X_out_of_100" in o) {
    invariant(
      typeof o.overrides_X_out_of_100 === "number",
      "endpointConfig.overrides_X_out_of_100 should a number"
    );
    copy.overrides_X_out_of_100 = o.overrides_X_out_of_100;
  }

  return copy;
}

export function asConfigOverrides(o: ConfigOverrides): ConfigOverrides {
  invariant(o && typeof o === "object", "ConfigOverrides: not an object");
  const copy: ConfigOverrides = {};

  if ("stable" in o) {
    copy.stable = asEndpointConfigOverrides(o.stable);
  }

  if ("experimental" in o) {
    copy.experimental = asEndpointConfigOverrides(o.experimental);
  }

  return copy;
}

export function asFullConfigOverrides(
  o: Record<string, any>
): FullConfigOverrides {
  invariant(o && typeof o === "object", "FullConfigOverrides: not an object");
  const copy = {};

  for (const k in o) {
    copy[k] = asConfigOverrides(o[k]);
  }

  return copy;
}
