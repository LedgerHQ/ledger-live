import { EnvName, getEnv } from "@ledgerhq/live-env";
import {
  FEATURE_FLAGS_DEFAULTS,
  selectFeature,
  type FeatureId,
  type WithFeatureFlags,
} from "@shared/feature-flags";
import { Primitive } from "~/types/helpers";
import { enabledExperimentalFeatures } from "../experimental";
import { store } from "~/state-manager/configureStore";

// The slice's `resolved` already applies env, override, and version/language filtering,
// so no language argument is needed here.
function getAllDivergedFlags(state: WithFeatureFlags): Partial<Record<FeatureId, boolean>> {
  const res: Partial<Record<FeatureId, boolean>> = {};
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  (Object.keys(FEATURE_FLAGS_DEFAULTS) as FeatureId[]).forEach(key => {
    const value = selectFeature(state, key);
    if (value && value.enabled !== FEATURE_FLAGS_DEFAULTS[key]?.enabled) {
      res[key] = value.enabled;
    }
  });
  return res;
}

const MAX_KEYLEN = 32;
const parseSafeKey = (k: string): string => {
  if (k.length > MAX_KEYLEN) {
    const sep = "..";
    const max = MAX_KEYLEN - sep.length;
    const split1 = Math.floor(max / 2);
    return k.slice(0, split1) + sep + k.slice(k.length - (max - split1));
  }
  return k;
};

// Add additional context to events sent to the monitoring tool

export const buildFeatureFlagTags = () => {
  const tags: { [_: string]: Primitive } = {};
  // if there are experimental on, we will add them in tags
  enabledExperimentalFeatures().forEach(key => {
    const v = getEnv(key as EnvName);
    if (typeof v !== "object" || !Array.isArray(v)) {
      tags[parseSafeKey(key)] = v;
    }
  });
  // if there are features on, we will add them in tags
  const features = getAllDivergedFlags(store.getState());
  Object.keys(features).forEach(key => {
    tags[parseSafeKey(`f_${key}`)] = features[key as keyof typeof features];
  });

  return tags;
};
