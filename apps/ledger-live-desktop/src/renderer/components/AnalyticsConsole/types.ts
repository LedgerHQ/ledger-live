import { LoggableEvent } from "~/renderer/analytics/segment";

export type LoggableEventRenderable = LoggableEvent & {
  id: number;
};
