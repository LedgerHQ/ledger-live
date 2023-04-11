import * as Sentry from "@sentry/electron/renderer";
import { BrowserTracing } from "@sentry/tracing";
import user from "./../helpers/user";
import { init, setShouldSendCallback } from "./install";
const available = init(Sentry, {
  integrations: [new BrowserTracing()],
});
export default async (shouldSendCallback: () => boolean) => {
  if (!available) return;
  setShouldSendCallback(shouldSendCallback);
  const u = await user();
  Sentry.setUser({
    id: u.id,
    ip_address: null,
  });
};
export const captureException = (e: Error) => {
  Sentry.captureException(e);
};
export const captureBreadcrumb = (o: any) => {
  Sentry.addBreadcrumb(o);
};
export const setTags = (tags: any) => {
  Sentry.setTags(tags);
};
export const getSentryIfAvailable = (): typeof Sentry | null => {
  return available ? Sentry : null;
};
