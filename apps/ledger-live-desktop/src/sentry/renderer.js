// @flow

import * as Sentry from "@sentry/electron/renderer";
import user from "./../helpers/user";
import { init, setShouldSendCallback } from "./install";

const available = init(Sentry);

export default async (shouldSendCallback: () => boolean) => {
  if (!available) return;
  setShouldSendCallback(shouldSendCallback);
  const u = await user();
  Sentry.setUser({ id: u.id, ip_address: null });
};

export const captureException = (e: Error) => {
  Sentry.captureException(e);
};

export const captureBreadcrumb = (o: *) => {
  Sentry.addBreadcrumb(o);
};
