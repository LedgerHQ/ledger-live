import {
  finalizeContentCardEventProperties,
  type ContentCardEvent,
  type ContentCardEventProperties,
} from "@ledgerhq/live-common/braze/contentCardExtras";
import { track } from "@shared/analytics";

export const trackContentCard = (
  event: ContentCardEvent,
  properties: ContentCardEventProperties,
) => {
  track(event, finalizeContentCardEventProperties(properties));
};
