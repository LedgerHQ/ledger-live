import { AnalyticsBrowser } from "@segment/analytics-next";
import { runOnceWhen } from "@ledgerhq/live-common/utils/runOnceWhen";
import { getEnv } from "@shared/env";
import {
  analyticsEvents$,
  setAnalytics,
  setEnabledFn,
  setExtraPropsFn,
  setMandatoryExtraPropsFn,
  setPropsFilter,
  track as sharedTrack,
  trackPage as sharedTrackPage,
} from "@shared/analytics";
import type { EventType } from "@shared/analytics";
import invariant from "invariant";
import type * as Redux from "redux";
import { userIdSelector } from "@domain/entity-client-identity";
import logger from "~/renderer/logger";
import type { State } from "~/renderer/reducers";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import { shouldIncludeSegmentIdentity } from "./segmentIdentity";
import {
  confidentialityFilter,
  extraProperties,
  getMandatoryProperties,
  hasAnalyticsFeatureFlagMethod,
  setAnalyticsFeatureFlagMethod,
} from "./extraProperties";

export { setAnalyticsFeatureFlagMethod };

type ReduxStore = Redux.MiddlewareAPI<Redux.Dispatch<Redux.UnknownAction>, State>;

invariant(typeof window !== "undefined", "analytics/segment must be called on renderer thread");

const getContext = () => ({
  ip: "0.0.0.0",
  page: {
    path: "/",
    referrer: "",
    search: "",
    title: "Ledger Live",
    url: "",
  },
});

let storeInstance: ReduxStore | null | undefined;
let analyticsInstance: AnalyticsBrowser | null = null;

export type { LoggableEvent } from "@shared/analytics";
export const trackSubject = analyticsEvents$;

setAnalytics({
  track: (event, props) => {
    analyticsInstance?.track(event, props, { context: getContext() });
  },
  log: (type: EventType, event, props) => {
    switch (type) {
      case "page":
        logger.analyticsPage(event, props);
        break;
      case "track":
        logger.analyticsTrack(event, props);
        break;
    }
  },
});

function initializeSegment() {
  if (analyticsInstance) return;

  const writeKey = process.env.SEGMENT_WRITE_KEY || "olBQc203GA3fXVa48rJB9c3826CY1axp";

  analyticsInstance = AnalyticsBrowser.load({
    writeKey,
    cdnSettings: {
      integrations: {
        "Segment.io": {
          apiKey: writeKey,
          apiHost: "api.segment.io/v1",
        },
      },
    },
  });
}

function getAnalytics(): AnalyticsBrowser | null {
  return analyticsInstance;
}

const publishIdentifyOverlay = (userIdPresent: boolean, failed: boolean) => {
  const overlayProperties = failed ? { userIdPresent, failed: true } : { userIdPresent };
  trackSubject.next({
    eventName: "[Identify]",
    eventProperties: overlayProperties,
    eventPropertiesWithoutExtra: overlayProperties,
    date: new Date(),
  });
};

const identifyAndLogOverlay = (
  analytics: AnalyticsBrowser,
  id: string | undefined,
  allProperties: Record<string, unknown>,
) => {
  void Promise.resolve()
    .then(() =>
      analytics.identify(id, allProperties, {
        context: getContext(),
      }),
    )
    .then(
      () => publishIdentifyOverlay(Boolean(id), false),
      () => publishIdentifyOverlay(Boolean(id), true),
    );
};

export const startAnalytics = async (store: ReduxStore) => {
  if (!process.env.SEGMENT_TEST && (getEnv("MOCK") || getEnv("PLAYWRIGHT_RUN"))) return;
  storeInstance = store;

  setEnabledFn(() => trackingEnabledSelector(store.getState()));
  setExtraPropsFn(() => extraProperties(store));
  setMandatoryExtraPropsFn(() => getMandatoryProperties(store));
  setPropsFilter(confidentialityFilter);

  const canBeTracked = trackingEnabledSelector(store.getState());
  if (!canBeTracked) return;

  const id = userIdSelector(store.getState()).exportUserIdForAnalytics();

  initializeSegment();

  const analytics = getAnalytics();
  if (!analytics) return;

  const allProperties = {
    ...extraProperties(store),
    userId: id,
    braze_external_id: id,
  };
  logger.analyticsStart(id, allProperties);
  identifyAndLogOverlay(analytics, id, allProperties);
};

export interface UpdateIdentifyOptions {
  /** When true, send identify even when both analytics opt-ins are false (e.g. after analytics prompt "Refuse all"). */
  force?: boolean;
}

export const updateIdentify = async ({ force }: UpdateIdentifyOptions = { force: false }) => {
  if (!storeInstance) return;

  const state = storeInstance.getState();
  const canTrack = force || trackingEnabledSelector(state);
  if (!canTrack) return;

  let analytics = getAnalytics();
  if (!analytics) {
    initializeSegment();
    analytics = getAnalytics();

    if (!analytics) return;
  }

  const includeIdentity = shouldIncludeSegmentIdentity(state);
  const id = includeIdentity ? userIdSelector(state).exportUserIdForAnalytics() : undefined;

  const allProperties = {
    ...extraProperties(storeInstance),
    ...(id ? { userId: id, braze_external_id: id } : {}),
  };
  identifyAndLogOverlay(analytics, id, allProperties);
};

runOnceWhen(() => hasAnalyticsFeatureFlagMethod() && !!getAnalytics(), updateIdentify);

export const track = (
  eventName: string,
  properties?: Record<string, unknown> | null,
  mandatory?: boolean | null,
) => {
  sharedTrack(eventName, properties, { mandatory: !!mandatory });
};

export const trackPage = (
  category: string,
  name?: string | null,
  properties?: Record<string, unknown> | null,
  updateRoutes?: boolean,
  refreshSource?: boolean,
  mandatory?: boolean,
) => {
  sharedTrackPage(
    { category, name, props: properties },
    {
      updateRoutes: !!updateRoutes,
      refreshSource: !!refreshSource,
      mandatory: !!mandatory,
    },
  );
};
