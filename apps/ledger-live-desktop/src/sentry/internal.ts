import * as Sentry from "@sentry/node";
import { Primitive } from "@sentry/types";
import "@sentry/tracing";
import { connectLogsToSentry } from "@ledgerhq/live-common/performance";
import { init, setShouldSendCallback } from "./install";
// @ts-expect-error The right type would be typeof SentryMainModule from "@sentry/electron/main"…
// …but we should avoid importing the whole module here
const available = init(Sentry, {
  integrations: [
    new Sentry.Integrations.Http({
      tracing: true,
    }),
  ],
});
if (available) {
  connectLogsToSentry(Sentry);
}
export default (shouldSendCallback: () => boolean, userId: string) => {
  if (!available) return;
  setShouldSendCallback(shouldSendCallback);
  Sentry.setUser({
    id: userId,
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
export const getSentryIfAvailable = (): typeof Sentry | null => {
  return available ? Sentry : null;
};
