import type { LoggableEvent } from "@shared/analytics";

export type LoggableEventRenderable = LoggableEvent & {
  id: number;
};
