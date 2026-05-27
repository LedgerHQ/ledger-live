import { useEffect, useRef, useState } from "react";
import { useSelector, useStore } from "LLD/hooks/redux";
import { EnvName, getEnv } from "@ledgerhq/live-env";
import {
  FEATURE_FLAGS_DEFAULTS,
  type Feature,
  type FeatureId,
  type Features,
} from "@shared/feature-flags";
import { useFeature, useFeatureFlags } from "@features/platform-feature-flags";
import { enabledExperimentalFeatures } from "~/renderer/experimental";
import { sentryLogsSelector } from "~/renderer/reducers/settings";
import { initDatadog, setTags, isDatadogAvailable } from "~/datadog/renderer";
import { initDatadogLogs } from "~/datadog/logs";

const MAX_KEYLEN = 32;

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
  const rawLldDatadog = useFeature("lldDatadog");
  const sentryLogs = useSelector(sentryLogsSelector);
  const lldDatadog = isLldDatadogFeature(rawLldDatadog) ? rawLldDatadog : null;
  const [datadogInitialized, setDatadogInitialized] = useState(false);
  const initInFlightRef = useRef(false);

  useEffect(() => {
    if (!lldDatadog?.enabled || !sentryLogs || !isDatadogAvailable() || datadogInitialized) return;
    if (initInFlightRef.current) return;

    let cancelled = false;
    initInFlightRef.current = true;

    const shouldSend = () => sentryLogsSelector(store.getState());
    initDatadogLogs(shouldSend);
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
      initInFlightRef.current = false;
      if (!cancelled && done) setDatadogInitialized(true);
    });

    return () => {
      cancelled = true;
      initInFlightRef.current = false;
    };
  }, [store, lldDatadog, sentryLogs, datadogInitialized]);

  useEffect(() => {
    if (!lldDatadog?.enabled || !datadogInitialized) return;

    const syncTheTags = () => {
      const tags: Record<string, string | number | boolean | null | undefined> = {};
      enabledExperimentalFeatures().forEach(key => {
        tags[safekey(key)] = getEnv(key as EnvName) as string | number | boolean;
      });
      const features: { [key in FeatureId]?: boolean } = {};
      Object.keys(FEATURE_FLAGS_DEFAULTS).forEach(k => {
        const key = k as keyof typeof FEATURE_FLAGS_DEFAULTS;
        const value = featureFlags[key];
        if (key && value && value.enabled !== FEATURE_FLAGS_DEFAULTS[key]!.enabled) {
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
