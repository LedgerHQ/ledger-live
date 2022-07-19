// @flow
import { memo, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { page } from "./segment";
import { getSentryIfAvailable } from "../../sentry/renderer";

let source;

export const setTrackingSource = (s?: string) => {
  source = s;
};

function inferSentryTags(props: any) {
  const tags: any = {};
  if (props.currencyId) {
    tags.currencyId = props.currencyId;
  }
  return tags;
}

function TrackPage({ category, name, ...properties }: { category: string, name?: string }) {
  useEffect(() => {
    page(category, name, { ...properties, ...(source ? { source } : {}) });
    // reset source param once it has been tracked to not repeat it from further unrelated navigation
    source = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sentry tracking
  const sentryFocusRef = useRef(null);
  const hash = `${category}_${name || ""}`;
  const sentryT = useMemo(
    () => {
      const Sentry = getSentryIfAvailable();
      if (!Sentry) return null;
      const t = Sentry.startTransaction({
        op: "page",
        name: `${category + (name ? ` ${name}` : "")} page`,
        tags: inferSentryTags(properties),
      });
      if (t) {
        Sentry.configureScope(scope => {
          scope.setSpan(t);
        });
      }
      return t;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, name],
  );
  useLayoutEffect(() => {
    if (sentryFocusRef.current !== hash) {
      sentryFocusRef.current = hash;
      if (sentryFocusRef.current) {
        sentryT?.finish();
      }
    }
  }, [hash, sentryT]);

  return null;
}

export default memo<{ category: string, name?: string }>(TrackPage);
