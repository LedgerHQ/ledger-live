import { useEffect, useState } from "react";
import { useSelector, useStore } from "LLD/hooks/redux";
import { EnvName, getEnv } from "@ledgerhq/live-env";
import { DEFAULT_FEATURES, useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { Feature, FeatureId, Features } from "@ledgerhq/types-live";
import { enabledExperimentalFeatures } from "~/renderer/experimental";
import { sentryLogsSelector } from "~/renderer/reducers/settings";
import { initDatadog, setTags, isDatadogAvailable } from "~/datadog/renderer";

const MAX_KEYLEN = 32;

function getLldDatadogFeature(featureFlags: {
  getFeature: (id: FeatureId) => Feature | null;
}): Features["lldDatadog"] | null {
  const raw = featureFlags.getFeature("lldDatadog");
  return isLldDatadogFeature(raw) ? raw : null;
}

function isLldDatadogFeature(f: Feature | null | undefined): f is Features["lldDatadog"] {
  return (
    f != null &&
    typeof f.enabled === "boolean" &&
    (f.params === undefined || (f.params !== null && typeof f.params === "object"))
  );
}

function safekey(k: string) {
  if (k.length > MAX_KEYLEN) {
    const sep = "..";
    const max = MAX_KEYLEN - sep.length;
    const split1 = Math.floor(max / 2);
    return k.slice(0, split1) + ".." + k.slice(k.length - (max - split1));
  }
  return k;
}

export const ConnectEnvsToDatadog = () => {
  const store = useStore();
  const featureFlags = useFeatureFlags();
  const sentryLogs = useSelector(sentryLogsSelector);
  const lldDatadog = getLldDatadogFeature(featureFlags);
  const [datadogInitialized, setDatadogInitialized] = useState(false);

  // Init Datadog when lldDatadog.enabled and user opt-in (sentryLogs)
  useEffect(() => {
    if (!lldDatadog?.enabled || !sentryLogs || !isDatadogAvailable() || datadogInitialized) return;

    const shouldSend = () => sentryLogsSelector(store.getState());
    initDatadog(
      shouldSend,
      {
        sessionSampleRate: lldDatadog.params?.sessionSamplingRate,
        sessionReplaySampleRate: lldDatadog.params?.sessionReplaySampleRate,
        defaultPrivacyLevel: lldDatadog.params?.defaultPrivacyLevel,
        traceSampleRate: lldDatadog.params?.traceSampleRate,
        allowedTracingUrls: lldDatadog.params?.allowedTracingUrls,
        profilingSampleRate: lldDatadog.params?.profilingSampleRate,
      },
      store,
    ).then(done => {
      if (done) setDatadogInitialized(true);
    });
  }, [store, lldDatadog, sentryLogs, datadogInitialized]);

  // Sync env and feature flag tags to Datadog (same logic as ConnectEnvsToSentry)
  useEffect(() => {
    if (!lldDatadog?.enabled || !datadogInitialized) return;

    const syncTheTags = () => {
      const tags: Record<string, string | number | boolean | null | undefined> = {};
      enabledExperimentalFeatures().forEach(key => {
        tags[safekey(key)] = getEnv(key as EnvName) as string | number | boolean;
      });
      const features: { [key in FeatureId]?: boolean } = {};
      Object.keys(DEFAULT_FEATURES).forEach(k => {
        const key = k as keyof typeof DEFAULT_FEATURES;
        const value = featureFlags.getFeature(key);
        if (key && value && value.enabled !== DEFAULT_FEATURES[key]!.enabled) {
          features[key] = value.enabled;
        }
      });
      Object.keys(features).forEach(key => {
        tags[safekey(`f_${key}`)] = features[key as keyof typeof features];
      });
      setTags(tags);
    };

    const timeout = setTimeout(syncTheTags, 5000);
    const interval = globalThis.window.setInterval(syncTheTags, 60000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [lldDatadog?.enabled, datadogInitialized, featureFlags]);

  return null;
};
