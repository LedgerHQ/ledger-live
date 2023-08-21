import { LoggableEvent } from "../../analytics";

export type LoggableEventRenderable = LoggableEvent & {
  id: string;
};
