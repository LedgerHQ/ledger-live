import * as Sentry from "@sentry/electron/main";
import { Primitive } from "@sentry/types";
import { init, setShouldSendCallback } from "./install";
const available = init(Sentry);
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
export const setTags = (tags: { [key: string]: Primitive }) => {
  Sentry.setTags(tags);
};
