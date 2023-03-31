import * as Sentry from "@sentry/electron/main";
import "@sentry/tracing";
import { init, setShouldSendCallback } from "./install";
const available = init(Sentry);
export default (shouldSendCallback: () => boolean, userId: string) => {
  if (!available) return;
  setShouldSendCallback(shouldSendCallback);
  Sentry.setUser({
    id: userId,
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
