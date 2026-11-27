import { useEffect, useRef, useState } from "react";
import { useSelector, useStore } from "LLD/hooks/redux";
import { EnvName, getEnv } from "@shared/env";
import {
  FEATURE_FLAGS_DEFAULTS,
  selectCachedFlagsSettled,
  type Feature,
  type FeatureId,
  type Features,
} from "@shared/feature-flags";
import { useFeature, useFeatureFlags } from "@features/platform-feature-flags";
import { enabledExperimentalFeatures } from "~/renderer/experimental";
import { crashReportingSelector } from "~/renderer/reducers/settings";
import {
  initDatadog,
  setTags,
  isDatadogAvailable,
  setDatadogActionsEnabled,
  setDatadogTrackingConsent,
} from "~/datadog/renderer";
import { initDatadogLogs } from "~/datadog/logs";
import { readCachedFlags, subscribeToRemoteFlags } from "~/firebase/remoteConfig";
import { db } from "~/renderer/bridge";

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
  const crashReporting = useSelector(crashReportingSelector);
  const [remoteFlagsFetched, setRemoteFlagsFetched] = useState(false);
  const [flagCached, setFlagCached] = useState(false);
  const cachedFlagsSettled = useSelector(selectCachedFlagsSettled);
  const lldDatadog = isLldDatadogFeature(rawLldDatadog) ? rawLldDatadog : null;
  const [datadogInitialized, setDatadogInitialized] = useState(false);
  const initInFlightRef = useRef(false);

  useEffect(() => {
    setDatadogActionsEnabled(!!lldDatadog?.enabled);
  }, [lldDatadog?.enabled]);

  useEffect(() => {
    if (datadogInitialized) setDatadogTrackingConsent(!!crashReporting);
  }, [crashReporting, datadogInitialized]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    // A flag cached from an earlier fetch is a real value too, for when the fetch keeps failing.
    void readCachedFlags().then(cached => !cancelled && setFlagCached(!!cached.lldDatadog));
    // Deferred a task: subscribers run before the middleware writes the fetched flags to the store.
    const unsubscribe = subscribeToRemoteFlags(() => {
      clearTimeout(timer);
      timer = setTimeout(setRemoteFlagsFetched, 0, true);
    });
    return () => {
      cancelled = true;
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
  const remoteFlagsKnown = remoteFlagsFetched || (flagCached && cachedFlagsSettled);

  const enabled = !!lldDatadog?.enabled;
  const sessionSampleRate = lldDatadog?.params?.sessionSamplingRate ?? 100;
  const profilingSampleRate = lldDatadog?.params?.profilingSampleRate ?? 0;
  useEffect(() => {
    // Not on the compiled default, which would turn main's reporting off.
    if (!remoteFlagsKnown) return;
    // Main inits before the renderer, so it boots on the last flag; written past storage.ts's debounce.
    db.setKey("app", "lldDatadog", { enabled, sessionSampleRate, profilingSampleRate }).catch(e =>
      console.warn("Datadog: could not persist lldDatadog for main", e),
    );
  }, [remoteFlagsKnown, enabled, sessionSampleRate, profilingSampleRate]);

  useEffect(() => {
    // Past storage.ts's 1s debounce, so main applies an opt-out at once.
    db.setKey("app", "settings.crashReporting", !!crashReporting).catch(e =>
      console.warn("Datadog: could not persist crashReporting for main", e),
    );
  }, [crashReporting]);

  useEffect(() => {
    if (!lldDatadog?.enabled || !crashReporting || !isDatadogAvailable() || datadogInitialized)
      return;
    if (initInFlightRef.current) return;

    let cancelled = false;
    initInFlightRef.current = true;

    const shouldSend = () => crashReportingSelector(store.getState());
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
        trackUserInteractions: lldDatadog.params?.trackUserInteractions,
        trackResources: lldDatadog.params?.trackResources,
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
  }, [store, lldDatadog, crashReporting, datadogInitialized]);

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
