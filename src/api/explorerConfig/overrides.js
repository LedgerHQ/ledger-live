// @flow
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
  let { version, overrides_X_out_of_100 } = overrides;
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
  const res: Config = { id: config.id, stable: config.stable };
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
    let c = config[k];
    let override = overrides[k];
    let o = override && c ? applyConfigOverrides(c, overrides[k]) : c;
    changed = changed || o !== c;
    all[k] = o;
  }
  return changed ? all : config;
}

export function asEndpointConfigOverrides(o: mixed): EndpointConfigOverrides {
  invariant(o && typeof o === "object", "EndpointConfig: not an object");
  let copy: EndpointConfigOverrides = {};
  if ("version" in o) {
    invariant(
      typeof o.version === "string",
      "endpointConfig.version should be string"
    );
    copy.version = o.version;
  }
  if ("overrides_X_out_of_100" in o) {
    invariant(
      typeof o.overrides_X_out_of_100 === "number",
      "endpointConfig.overrides_X_out_of_100 should a number"
    );
    copy.overrides_X_out_of_100 = o.overrides_X_out_of_100;
  }
  return copy;
}

export function asConfigOverrides(o: mixed): ConfigOverrides {
  invariant(o && typeof o === "object", "ConfigOverrides: not an object");
  let copy = {};
  if ("stable" in o) {
    copy.stable = asEndpointConfigOverrides(o.stable);
  }
  if ("experimental" in o) {
    copy.experimental = asEndpointConfigOverrides(o.experimental);
  }
  return copy;
}

export function asFullConfigOverrides(o: mixed): FullConfigOverrides {
  invariant(o && typeof o === "object", "FullConfigOverrides: not an object");
  let copy = {};
  for (let k in o) {
    copy[k] = asConfigOverrides(o[k]);
  }
  return copy;
}
