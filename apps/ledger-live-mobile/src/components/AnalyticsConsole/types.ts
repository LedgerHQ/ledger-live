import { LoggableEvent } from "@shared/analytics";

export type LoggableEventRenderable = LoggableEvent & {
  id: string;
};
