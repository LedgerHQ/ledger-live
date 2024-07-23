import * as Sentry from "@sentry/electron/renderer";
import user from "./../helpers/user";
import { init, setShouldSendCallback } from "./install";
import { Primitive } from "@sentry/types";
// @ts-expect-error The right type would be SentryMainModule from "@sentry/electron/main"…
// …but we should avoid importing the whole module and blow the bundle size
const available = init(Sentry, {
  integrations: [Sentry.browserTracingIntegration()],
});
export default async (shouldSendCallback: () => boolean) => {
  if (!available) return;
  setShouldSendCallback(shouldSendCallback);
  const u = await user();
  Sentry.setUser({
    id: u.id,
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
