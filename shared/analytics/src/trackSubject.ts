import { ReplaySubject } from "rxjs";
import type { LoggableEvent } from "./types";

/** Dev bus consumed by the in-app analytics consoles. Replays the last 30 events to a late subscriber. */
export const trackSubject = new ReplaySubject<LoggableEvent>(30);
