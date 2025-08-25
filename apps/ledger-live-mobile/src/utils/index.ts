import { EnvName, getEnv } from "@ledgerhq/live-env";
import { Primitive } from "~/types/helpers";
import { enabledExperimentalFeatures } from "../experimental";
import { getAllDivergedFlags } from "../components/FirebaseFeatureFlags";
import { languageSelector } from "../reducers/settings";
import { store } from "../context/store";

const MAX_KEYLEN = 32;
export const parseSafeKey = (k: string): string => {
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
  const appLanguage = languageSelector(store.getState());
  const features = getAllDivergedFlags(appLanguage);
  Object.keys(features).forEach(key => {
    tags[parseSafeKey(`f_${key}`)] = features[key as keyof typeof features];
  });

  return tags;
};
