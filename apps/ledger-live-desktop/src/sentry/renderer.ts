import * as Sentry from "@sentry/electron/renderer";
import { datadogIdSelector } from "@ledgerhq/client-ids/store";
import { init, setShouldSendCallback } from "./install";
import { Primitive } from "@sentry/types";
import type { Store } from "redux";
import type { State } from "~/renderer/reducers";
// @ts-expect-error The right type would be SentryMainModule from "@sentry/electron/main"…
// …but we should avoid importing the whole module and blow the bundle size
const available = init(Sentry, {
  integrations: [Sentry.browserTracingIntegration()],
});
export default async (shouldSendCallback: () => boolean, store: Store<State>) => {
  if (!available) return;
  setShouldSendCallback(shouldSendCallback);
  const datadogId = datadogIdSelector(store.getState());
  Sentry.setUser({
    id: datadogId.exportDatadogIdForSentry(),
    ip_address: undefined,
  });
};
export const captureException = (e: Error) => {
  Sentry.captureException(e);
};
export const captureBreadcrumb = (o: Sentry.Breadcrumb) => {
  Sentry.addBreadcrumb(o);
};
export const setTags = (tags: { [key: string]: Primitive }) => {
  Sentry.setTags(tags);
};
