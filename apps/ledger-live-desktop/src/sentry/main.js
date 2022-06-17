// @flow
import * as Sentry from "@sentry/electron/main";
import { init, setShouldSendCallback } from "./install";

const available = init(Sentry);

export default (shouldSendCallback: () => boolean, userId: string) => {
  if (!available) return;
  setShouldSendCallback(shouldSendCallback);
  Sentry.setUser({ id: userId, ip_address: null });
};

export const captureException = (e: Error) => {
  Sentry.captureException(e);
};

export const captureBreadcrumb = (o: *) => {
  Sentry.addBreadcrumb(o);
};
